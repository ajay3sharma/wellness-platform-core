import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import {
  Prisma,
  type BillingProvider as PrismaBillingProvider,
  type Market as PrismaMarket
} from "@prisma/client";
import { resolveBillingCurrency, resolveBillingProvider } from "@platform/billing";
import { platformConfig, runtimeEnv } from "@platform/config";
import type {
  Cart,
  CatalogProductDetail,
  CatalogProductListItem,
  CheckoutLaunch,
  CheckoutSession,
  ContentStatus,
  CreateCartCheckoutRequest,
  CreateSubscriptionCheckoutRequest,
  CurrentUser,
  EntitlementSnapshot,
  Market,
  OrderRecord,
  SaveCatalogProductRequest,
  SaveSubscriptionPlanRequest,
  SubscriptionPlanDetail,
  SubscriptionStatus,
  UpdateCartItemRequest,
  UpsertCartItemRequest,
  UserSubscription
} from "@platform/types";
import { randomBytes, randomUUID } from "node:crypto";
import { apiConfig } from "../config/api-config";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "./billing.service";

type ProductWithPrices = Prisma.CatalogProductGetPayload<{
  include: {
    prices: true;
  };
}>;

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: {
            prices: true;
          };
        };
      };
    };
  };
}>;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
    user: true;
    checkoutSession: true;
  };
}>;

type SubscriptionWithPlan = Prisma.UserSubscriptionGetPayload<{
  include: {
    user: true;
    subscriptionPlan: true;
    checkoutSession: true;
  };
}>;

type PlanWithPrices = Prisma.SubscriptionPlanGetPayload<{
  include: {
    prices: true;
  };
}>;

interface StripeWebhookObject {
  id?: string;
  metadata?: Record<string, string>;
  mode?: string;
  subscription?: string | null;
}

interface StripeSubscriptionWebhookObject {
  id?: string;
  metadata?: Record<string, string>;
  status?: string;
  current_period_start?: number | null;
  current_period_end?: number | null;
  canceled_at?: number | null;
}

interface RazorpayWebhookPayload {
  event?: string;
  payload?: Record<string, { entity?: Record<string, unknown> }>;
  created_at?: number;
}

@Injectable()
export class CommerceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService
  ) {}

  async listPublishedProducts(): Promise<CatalogProductListItem[]> {
    const records = await this.prisma.catalogProduct.findMany({
      where: {
        status: "published"
      },
      include: {
        prices: {
          where: {
            isCurrent: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return records.map((record) => this.toCatalogProduct(record));
  }

  async getPublishedProductDetail(productId: string): Promise<CatalogProductDetail> {
    const record = await this.prisma.catalogProduct.findFirst({
      where: {
        id: productId,
        status: "published"
      },
      include: {
        prices: {
          where: {
            isCurrent: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!record) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "The requested product could not be found."
      });
    }

    return this.toCatalogProduct(record);
  }

  async listPublishedPlans(): Promise<SubscriptionPlanDetail[]> {
    const records = await this.prisma.subscriptionPlan.findMany({
      where: {
        status: "published"
      },
      include: {
        prices: {
          where: {
            isCurrent: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return records.map((record) => this.toSubscriptionPlan(record));
  }

  async listAdminProducts(): Promise<CatalogProductListItem[]> {
    const records = await this.prisma.catalogProduct.findMany({
      include: {
        prices: {
          where: {
            isCurrent: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return records.map((record) => this.toCatalogProduct(record));
  }

  async createProduct(payload: SaveCatalogProductRequest): Promise<CatalogProductDetail> {
    this.assertPriceMarkets(payload.prices);

    const record = await this.prisma.catalogProduct.create({
      data: {
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category?.trim() || null,
        tags: this.normalizeTags(payload.tags),
        coverImageUrl: payload.coverImageUrl || null,
        purchaseLabel: payload.purchaseLabel?.trim() || null,
        prices: {
          create: payload.prices.map((price) => ({
            market: price.market,
            currency: this.resolveCurrency(price.market, price.currency),
            amountMinor: price.amountMinor,
            isCurrent: true
          }))
        }
      },
      include: {
        prices: {
          where: {
            isCurrent: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    return this.toCatalogProduct(record);
  }

  async updateProduct(
    productId: string,
    payload: SaveCatalogProductRequest
  ): Promise<CatalogProductDetail> {
    this.assertPriceMarkets(payload.prices);
    await this.assertProductExists(productId);

    const record = await this.prisma.$transaction(async (tx) => {
      await tx.catalogProductPrice.updateMany({
        where: {
          productId,
          isCurrent: true
        },
        data: {
          isCurrent: false
        }
      });

      await tx.catalogProduct.update({
        where: {
          id: productId
        },
        data: {
          title: payload.title.trim(),
          description: payload.description.trim(),
          category: payload.category?.trim() || null,
          tags: this.normalizeTags(payload.tags),
          coverImageUrl: payload.coverImageUrl || null,
          purchaseLabel: payload.purchaseLabel?.trim() || null,
          prices: {
            create: payload.prices.map((price) => ({
              market: price.market,
              currency: this.resolveCurrency(price.market, price.currency),
              amountMinor: price.amountMinor,
              isCurrent: true
            }))
          }
        }
      });

      return tx.catalogProduct.findUniqueOrThrow({
        where: {
          id: productId
        },
        include: {
          prices: {
            where: {
              isCurrent: true
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        }
      });
    });

    return this.toCatalogProduct(record);
  }

  async setProductStatus(productId: string, status: ContentStatus): Promise<CatalogProductDetail> {
    const record = await this.prisma.catalogProduct.update({
      where: {
        id: productId
      },
      data: {
        status,
        publishedAt: status === "published" ? new Date() : null
      },
      include: {
        prices: {
          where: {
            isCurrent: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    return this.toCatalogProduct(record);
  }

  async listAdminPlans(): Promise<SubscriptionPlanDetail[]> {
    const records = await this.prisma.subscriptionPlan.findMany({
      include: {
        prices: {
          where: {
            isCurrent: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return records.map((record) => this.toSubscriptionPlan(record));
  }

  async createPlan(payload: SaveSubscriptionPlanRequest): Promise<SubscriptionPlanDetail> {
    this.assertPriceMarkets(payload.prices);

    const record = await this.prisma.subscriptionPlan.create({
      data: {
        name: payload.name.trim(),
        description: payload.description.trim(),
        userPlan: payload.userPlan,
        billingInterval: payload.billingInterval,
        features: this.normalizeTags(payload.features),
        prices: {
          create: payload.prices.map((price) => ({
            market: price.market,
            currency: this.resolveCurrency(price.market, price.currency),
            amountMinor: price.amountMinor,
            isCurrent: true
          }))
        }
      },
      include: {
        prices: {
          where: {
            isCurrent: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    return this.toSubscriptionPlan(record);
  }

  async updatePlan(
    planId: string,
    payload: SaveSubscriptionPlanRequest
  ): Promise<SubscriptionPlanDetail> {
    this.assertPriceMarkets(payload.prices);
    await this.assertPlanExists(planId);

    const record = await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionPlanPrice.updateMany({
        where: {
          subscriptionPlanId: planId,
          isCurrent: true
        },
        data: {
          isCurrent: false
        }
      });

      await tx.subscriptionPlan.update({
        where: {
          id: planId
        },
        data: {
          name: payload.name.trim(),
          description: payload.description.trim(),
          userPlan: payload.userPlan,
          billingInterval: payload.billingInterval,
          features: this.normalizeTags(payload.features),
          prices: {
            create: payload.prices.map((price) => ({
              market: price.market,
              currency: this.resolveCurrency(price.market, price.currency),
              amountMinor: price.amountMinor,
              isCurrent: true
            }))
          }
        }
      });

      return tx.subscriptionPlan.findUniqueOrThrow({
        where: {
          id: planId
        },
        include: {
          prices: {
            where: {
              isCurrent: true
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        }
      });
    });

    return this.toSubscriptionPlan(record);
  }

  async setPlanStatus(planId: string, status: ContentStatus): Promise<SubscriptionPlanDetail> {
    const record = await this.prisma.subscriptionPlan.update({
      where: {
        id: planId
      },
      data: {
        status,
        publishedAt: status === "published" ? new Date() : null
      },
      include: {
        prices: {
          where: {
            isCurrent: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    return this.toSubscriptionPlan(record);
  }

  async getCart(user: CurrentUser, market?: Market): Promise<Cart> {
    const resolvedMarket = market ?? apiConfig.brand.billing.defaultMarket;
    const cart = await this.getOrCreateCartRecord(user.id, resolvedMarket);
    return this.toCart(cart, resolvedMarket);
  }

  async upsertCartItem(user: CurrentUser, payload: UpsertCartItemRequest): Promise<Cart> {
    const product = await this.prisma.catalogProduct.findFirst({
      where: {
        id: payload.productId,
        status: "published",
        prices: {
          some: {
            isCurrent: true,
            market: payload.market
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "The selected product is not available in this market."
      });
    }

    const cart = await this.prisma.cart.upsert({
      where: {
        userId_market: {
          userId: user.id,
          market: payload.market
        }
      },
      update: {},
      create: {
        userId: user.id,
        market: payload.market,
        items: {
          create: {
            productId: payload.productId,
            quantity: payload.quantity
          }
        }
      }
    });

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: payload.productId
        }
      },
      update: {
        quantity: payload.quantity
      },
      create: {
        cartId: cart.id,
        productId: payload.productId,
        quantity: payload.quantity
      }
    });

    return this.getCart(user, payload.market);
  }

  async updateCartItem(
    user: CurrentUser,
    itemId: string,
    payload: UpdateCartItemRequest
  ): Promise<Cart> {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId: user.id
        }
      },
      include: {
        cart: true
      }
    });

    if (!item) {
      throw new NotFoundException({
        code: "CART_ITEM_NOT_FOUND",
        message: "The cart item could not be found."
      });
    }

    await this.prisma.cartItem.update({
      where: {
        id: item.id
      },
      data: {
        quantity: payload.quantity
      }
    });

    return this.getCart(user, item.cart.market as Market);
  }

  async removeCartItem(user: CurrentUser, itemId: string): Promise<Cart> {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId: user.id
        }
      },
      include: {
        cart: true
      }
    });

    if (!item) {
      throw new NotFoundException({
        code: "CART_ITEM_NOT_FOUND",
        message: "The cart item could not be found."
      });
    }

    await this.prisma.cartItem.delete({
      where: {
        id: item.id
      }
    });

    return this.getCart(user, item.cart.market as Market);
  }

  async createCartCheckoutSession(
    user: CurrentUser,
    payload: CreateCartCheckoutRequest
  ): Promise<CheckoutLaunch> {
    const cart = await this.getOrCreateCartRecord(user.id, payload.market);
    const validItems = cart.items
      .map((item) => {
        const price = item.product.prices.find(
          (currentPrice) =>
            currentPrice.isCurrent && currentPrice.market === (payload.market as PrismaMarket)
        );

        if (!price || item.product.status !== "published") {
          return null;
        }

        return {
          productId: item.productId,
          title: item.product.title,
          coverImageUrl: item.product.coverImageUrl,
          quantity: item.quantity,
          unitAmountMinor: price.amountMinor,
          totalAmountMinor: price.amountMinor * item.quantity
        };
      })
      .filter(Boolean) as Array<{
      productId: string;
      title: string;
      coverImageUrl: string | null;
      quantity: number;
      unitAmountMinor: number;
      totalAmountMinor: number;
    }>;

    if (validItems.length === 0) {
      throw new BadRequestException({
        code: "EMPTY_CART",
        message: "Add at least one published product before checkout."
      });
    }

    const provider = resolveBillingProvider(payload.market, apiConfig.brand);
    const currency = resolveBillingCurrency(payload.market, apiConfig.brand);
    const amountMinor = validItems.reduce((sum, item) => sum + item.totalAmountMinor, 0);
    const checkoutSessionId = randomUUID();
    const launchToken = randomBytes(24).toString("hex");
    const returnUrls = this.buildReturnUrls(checkoutSessionId, payload.surface);

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        provider: provider as PrismaBillingProvider,
        market: payload.market as PrismaMarket,
        currency,
        amountMinor,
        items: {
          create: validItems.map((item) => ({
            productId: item.productId,
            title: item.title,
            quantity: item.quantity,
            unitAmountMinor: item.unitAmountMinor,
            totalAmountMinor: item.totalAmountMinor,
            coverImageUrl: item.coverImageUrl
          }))
        }
      }
    });

    const billingLaunch =
      provider === "stripe"
        ? await this.billingService.createStripeCheckoutSession({
            mode: "payment",
            lineItems: validItems.map((item) => ({
              name: item.title,
              description: apiConfig.brand.productName,
              amountMinor: item.unitAmountMinor,
              quantity: item.quantity,
              currency
            })),
            successUrl: returnUrls.successUrl,
            cancelUrl: returnUrls.cancelUrl,
            customerEmail: user.email,
            metadata: {
              checkoutSessionId,
              orderId: order.id,
              userId: user.id
            }
          })
        : await this.billingService.createRazorpayOrder({
            name: this.billingService.getBrandDisplayName(),
            description: "Digital product checkout",
            amountMinor,
            currency,
            notes: {
              checkoutSessionId,
              orderId: order.id,
              userId: user.id
            },
            prefill: {
              name: user.displayName,
              email: user.email
            },
            successUrl: returnUrls.successUrl,
            cancelUrl: returnUrls.cancelUrl
          });

    const expiresAt =
      billingLaunch.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await this.prisma.billingCheckoutSession.create({
      data: {
        id: checkoutSessionId,
        userId: user.id,
        kind: "cart",
        provider: provider as PrismaBillingProvider,
        market: payload.market as PrismaMarket,
        targetSurface: payload.surface,
        launchToken,
        currency,
        amountMinor,
        providerSessionId: billingLaunch.providerSessionId ?? null,
        providerOrderId: billingLaunch.providerOrderId ?? null,
        providerCheckoutUrl: billingLaunch.providerCheckoutUrl ?? null,
        successUrl: returnUrls.successUrl,
        cancelUrl: returnUrls.cancelUrl,
        expiresAt: new Date(expiresAt),
        snapshot: billingLaunch.snapshot
          ? (billingLaunch.snapshot as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        orderId: order.id
      }
    });

    return {
      checkoutSessionId,
      provider,
      market: payload.market,
      launchUrl: this.buildLaunchUrl(checkoutSessionId, launchToken),
      expiresAt
    };
  }

  async createSubscriptionCheckoutSession(
    user: CurrentUser,
    payload: CreateSubscriptionCheckoutRequest
  ): Promise<CheckoutLaunch> {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        id: payload.subscriptionPlanId,
        status: "published"
      },
      include: {
        prices: {
          where: {
            isCurrent: true,
            market: payload.market as PrismaMarket
          }
        }
      }
    });

    if (!plan || plan.prices.length === 0) {
      throw new NotFoundException({
        code: "PLAN_NOT_FOUND",
        message: "The selected subscription plan is not available in this market."
      });
    }

    const existingActive = await this.prisma.userSubscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ["pending", "active"]
        }
      }
    });

    if (existingActive) {
      throw new BadRequestException({
        code: "SUBSCRIPTION_ALREADY_EXISTS",
        message: "A pending or active subscription already exists for this user."
      });
    }

    const price = plan.prices[0];
    const provider = resolveBillingProvider(payload.market, apiConfig.brand);
    const checkoutSessionId = randomUUID();
    const launchToken = randomBytes(24).toString("hex");
    const returnUrls = this.buildReturnUrls(checkoutSessionId, payload.surface);

    const subscription = await this.prisma.userSubscription.create({
      data: {
        userId: user.id,
        subscriptionPlanId: plan.id,
        planName: plan.name,
        userPlan: plan.userPlan,
        billingInterval: plan.billingInterval,
        provider: provider as PrismaBillingProvider,
        market: payload.market as PrismaMarket,
        currency: price.currency,
        amountMinor: price.amountMinor
      }
    });

    const billingLaunch =
      provider === "stripe"
        ? await this.billingService.createStripeCheckoutSession({
            mode: "subscription",
            lineItems: [
              {
                name: plan.name,
                description: plan.description,
                amountMinor: price.amountMinor,
                quantity: 1,
                currency: price.currency
              }
            ],
            successUrl: returnUrls.successUrl,
            cancelUrl: returnUrls.cancelUrl,
            customerEmail: user.email,
            recurringInterval: plan.billingInterval as "month" | "year",
            metadata: {
              checkoutSessionId,
              subscriptionId: subscription.id,
              userId: user.id
            }
          })
        : await this.billingService.createRazorpaySubscription({
            name: plan.name,
            description: plan.description,
            amountMinor: price.amountMinor,
            currency: price.currency,
            billingInterval: plan.billingInterval as "month" | "year",
            notes: {
              checkoutSessionId,
              subscriptionId: subscription.id,
              userId: user.id
            },
            prefill: {
              name: user.displayName,
              email: user.email
            },
            successUrl: returnUrls.successUrl,
            cancelUrl: returnUrls.cancelUrl
          });

    const expiresAt =
      billingLaunch.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await this.prisma.billingCheckoutSession.create({
      data: {
        id: checkoutSessionId,
        userId: user.id,
        kind: "subscription",
        provider: provider as PrismaBillingProvider,
        market: payload.market as PrismaMarket,
        targetSurface: payload.surface,
        launchToken,
        currency: price.currency,
        amountMinor: price.amountMinor,
        providerSessionId: billingLaunch.providerSessionId ?? null,
        providerSubscriptionId: billingLaunch.providerSubscriptionId ?? null,
        providerCheckoutUrl: billingLaunch.providerCheckoutUrl ?? null,
        successUrl: returnUrls.successUrl,
        cancelUrl: returnUrls.cancelUrl,
        expiresAt: new Date(expiresAt),
        snapshot: billingLaunch.snapshot
          ? (billingLaunch.snapshot as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        subscriptionId: subscription.id
      }
    });

    if (billingLaunch.providerSubscriptionId) {
      await this.prisma.userSubscription.update({
        where: {
          id: subscription.id
        },
        data: {
          providerSubscriptionId: billingLaunch.providerSubscriptionId
        }
      });
    }

    return {
      checkoutSessionId,
      provider,
      market: payload.market,
      launchUrl: this.buildLaunchUrl(checkoutSessionId, launchToken),
      expiresAt
    };
  }

  async getCheckoutSessionLaunch(checkoutSessionId: string, token: string): Promise<CheckoutSession> {
    const record = await this.prisma.billingCheckoutSession.findUnique({
      where: {
        id: checkoutSessionId
      }
    });

    if (!record || record.launchToken !== token) {
      throw new UnauthorizedException({
        code: "INVALID_CHECKOUT_TOKEN",
        message: "The checkout session token is invalid."
      });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException({
        code: "CHECKOUT_SESSION_EXPIRED",
        message: "The checkout session has expired."
      });
    }

    return {
      id: record.id,
      provider: record.provider as CheckoutSession["provider"],
      market: record.market as Market,
      currency: record.currency,
      amountMinor: record.amountMinor,
      kind: record.kind,
      expiresAt: record.expiresAt.toISOString(),
      target: {
        surface: record.targetSurface,
        market: record.market as Market
      },
      providerCheckoutUrl: record.providerCheckoutUrl,
      razorpay: record.provider === "razorpay"
        ? {
            keyId: this.getSnapshotValue(record.snapshot, "keyId"),
            name: this.getSnapshotValue(record.snapshot, "name"),
            description: this.getSnapshotValue(record.snapshot, "description"),
            orderId: record.providerOrderId,
            subscriptionId: record.providerSubscriptionId,
            prefill: {
              name: this.getNestedSnapshotValue(record.snapshot, ["prefill", "name"]),
              email: this.getNestedSnapshotValue(record.snapshot, ["prefill", "email"])
            },
            callbackUrls: {
              success: this.getNestedSnapshotValue(record.snapshot, ["callbackUrls", "success"]),
              cancel: this.getNestedSnapshotValue(record.snapshot, ["callbackUrls", "cancel"])
            }
          }
        : null
    };
  }

  async listOrdersForUser(user: CurrentUser): Promise<OrderRecord[]> {
    const records = await this.prisma.order.findMany({
      where: {
        userId: user.id
      },
      include: {
        items: true,
        user: true,
        checkoutSession: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return records.map((record) => this.toOrder(record));
  }

  async listAdminOrders(): Promise<OrderRecord[]> {
    const records = await this.prisma.order.findMany({
      include: {
        items: true,
        user: true,
        checkoutSession: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return records.map((record) => this.toOrder(record));
  }

  async getAdminOrder(orderId: string): Promise<OrderRecord> {
    const record = await this.prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        items: true,
        user: true,
        checkoutSession: true
      }
    });

    if (!record) {
      throw new NotFoundException({
        code: "ORDER_NOT_FOUND",
        message: "The requested order could not be found."
      });
    }

    return this.toOrder(record);
  }

  async getSubscriptionForUser(user: CurrentUser): Promise<UserSubscription | null> {
    const record = await this.prisma.userSubscription.findFirst({
      where: {
        userId: user.id
      },
      include: {
        user: true,
        subscriptionPlan: true,
        checkoutSession: true
      },
      orderBy: [
        {
          activatedAt: "desc"
        },
        {
          createdAt: "desc"
        }
      ]
    });

    return record ? this.toUserSubscription(record) : null;
  }

  async listAdminSubscriptions(): Promise<UserSubscription[]> {
    const records = await this.prisma.userSubscription.findMany({
      include: {
        user: true,
        subscriptionPlan: true,
        checkoutSession: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return records.map((record) => this.toUserSubscription(record));
  }

  async getEntitlements(user: CurrentUser): Promise<EntitlementSnapshot> {
    const [subscription, entitlements] = await Promise.all([
      this.getSubscriptionForUser(user),
      this.prisma.userProductEntitlement.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          grantedAt: "desc"
        }
      })
    ]);

    return {
      userPlan: subscription?.status === "active" ? subscription.userPlan : "free",
      activeSubscription: subscription?.status === "active" ? subscription : null,
      ownedProducts: entitlements.map((entitlement) => ({
        productId: entitlement.productId,
        title: entitlement.title,
        orderId: entitlement.orderId,
        grantedAt: entitlement.grantedAt.toISOString()
      }))
    };
  }

  async handleStripeWebhook(rawBody: Buffer, signatureHeader: string | undefined) {
    const event = this.billingService.verifyStripeWebhook(rawBody, signatureHeader);
    const externalEventId = String(event.id ?? "");

    if (!externalEventId) {
      throw new BadRequestException({
        code: "INVALID_WEBHOOK_PAYLOAD",
        message: "Stripe webhook payload is missing an event id."
      });
    }

    const duplicate = await this.registerWebhookReceipt("stripe", externalEventId, event);
    if (duplicate) {
      return { received: true, duplicate: true };
    }

    const eventType = String(event.type ?? "");
    const object = ((event.data as Record<string, unknown> | undefined)?.object ??
      {}) as StripeWebhookObject;

    if (eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded") {
      await this.handleStripeCheckoutCompletion(object);
    } else if (eventType === "customer.subscription.created" || eventType === "customer.subscription.updated") {
      await this.handleStripeSubscriptionUpdate(object as StripeSubscriptionWebhookObject);
    } else if (eventType === "customer.subscription.deleted") {
      await this.handleStripeSubscriptionCancellation(object as StripeSubscriptionWebhookObject);
    } else if (eventType === "invoice.payment_failed") {
      await this.handleStripeInvoiceFailure(object as Record<string, unknown>);
    }

    await this.markWebhookProcessed("stripe", externalEventId);
    return { received: true };
  }

  async handleRazorpayWebhook(
    rawBody: Buffer,
    signatureHeader: string | undefined,
    eventIdHeader: string | undefined
  ) {
    const event = this.billingService.verifyRazorpayWebhook(rawBody, signatureHeader) as RazorpayWebhookPayload;
    const externalEventId = eventIdHeader || `${event.event ?? "unknown"}:${event.created_at ?? Date.now()}`;

    const duplicate = await this.registerWebhookReceipt("razorpay", externalEventId, event as Record<string, unknown>);
    if (duplicate) {
      return { received: true, duplicate: true };
    }

    switch (event.event) {
      case "order.paid":
      case "payment.captured":
        await this.handleRazorpayOrderPaid(event);
        break;
      case "payment.failed":
        await this.handleRazorpayPaymentFailed(event);
        break;
      case "subscription.authenticated":
        await this.handleRazorpaySubscriptionUpdate(event, "pending");
        break;
      case "subscription.activated":
      case "subscription.charged":
        await this.handleRazorpaySubscriptionUpdate(event, "active");
        break;
      case "subscription.pending":
      case "subscription.halted":
        await this.handleRazorpaySubscriptionUpdate(event, "payment_failed");
        break;
      case "subscription.cancelled":
        await this.handleRazorpaySubscriptionUpdate(event, "cancelled");
        break;
      default:
        break;
    }

    await this.markWebhookProcessed("razorpay", externalEventId);
    return { received: true };
  }

  private async handleStripeCheckoutCompletion(object: StripeWebhookObject) {
    const checkoutSessionId = object.metadata?.checkoutSessionId;

    if (!checkoutSessionId) {
      return;
    }

    const session = await this.prisma.billingCheckoutSession.findUnique({
      where: {
        id: checkoutSessionId
      },
      include: {
        order: {
          include: {
            items: true,
            user: true
          }
        },
        subscription: {
          include: {
            user: true
          }
        }
      }
    });

    if (!session) {
      return;
    }

    if (session.kind === "cart" && session.order) {
      await this.markOrderPaid(session.id, {
        providerSessionId: object.id ?? null
      });
      return;
    }

    if (session.kind === "subscription" && session.subscription) {
      await this.prisma.$transaction([
        this.prisma.userSubscription.update({
          where: {
            id: session.subscription.id
          },
          data: {
            status: "active",
            providerSubscriptionId: object.subscription || session.providerSubscriptionId,
            activatedAt: session.subscription.activatedAt ?? new Date()
          }
        }),
        this.prisma.billingCheckoutSession.update({
          where: {
            id: session.id
          },
          data: {
            providerSessionId: object.id ?? session.providerSessionId,
            providerSubscriptionId: object.subscription || session.providerSubscriptionId,
            status: "completed",
            completedAt: new Date()
          }
        })
      ]);
    }
  }

  private async handleStripeSubscriptionUpdate(object: StripeSubscriptionWebhookObject) {
    const internalSubscriptionId =
      object.metadata?.subscriptionId ??
      object.metadata?.internalSubscriptionId ??
      null;

    const record = internalSubscriptionId
      ? await this.prisma.userSubscription.findUnique({
          where: {
            id: internalSubscriptionId
          },
          include: {
            user: true,
            subscriptionPlan: true,
            checkoutSession: true
          }
        })
      : await this.prisma.userSubscription.findFirst({
          where: {
            providerSubscriptionId: object.id ?? undefined
          },
          include: {
            user: true,
            subscriptionPlan: true,
            checkoutSession: true
          }
        });

    if (!record || !object.id) {
      return;
    }

    const mappedStatus = this.mapStripeSubscriptionStatus(object.status);

    await this.prisma.$transaction([
      this.prisma.userSubscription.update({
        where: {
          id: record.id
        },
        data: {
          providerSubscriptionId: object.id,
          status: mappedStatus,
          activatedAt:
            mappedStatus === "active" ? record.activatedAt ?? new Date() : record.activatedAt,
          cancelledAt:
            mappedStatus === "cancelled"
              ? toDateOrNull(object.canceled_at) ?? record.cancelledAt ?? new Date()
              : null,
          currentPeriodStart: toDateOrNull(object.current_period_start),
          currentPeriodEnd: toDateOrNull(object.current_period_end)
        }
      }),
      this.prisma.billingCheckoutSession.updateMany({
        where: {
          subscriptionId: record.id
        },
        data: {
          providerSubscriptionId: object.id,
          status: mappedStatus === "payment_failed" ? "failed" : "completed",
          completedAt: new Date()
        }
      })
    ]);
  }

  private async handleStripeSubscriptionCancellation(object: StripeSubscriptionWebhookObject) {
    if (!object.id) {
      return;
    }

    const record = await this.prisma.userSubscription.findFirst({
      where: {
        providerSubscriptionId: object.id
      }
    });

    if (!record) {
      return;
    }

    await this.prisma.userSubscription.update({
      where: {
        id: record.id
      },
      data: {
        status: "cancelled",
        cancelledAt: toDateOrNull(object.canceled_at) ?? new Date()
      }
    });
  }

  private async handleStripeInvoiceFailure(object: Record<string, unknown>) {
    const providerSubscriptionId = typeof object.subscription === "string" ? object.subscription : null;

    if (!providerSubscriptionId) {
      return;
    }

    await this.prisma.userSubscription.updateMany({
      where: {
        providerSubscriptionId
      },
      data: {
        status: "payment_failed"
      }
    });
  }

  private async handleRazorpayOrderPaid(event: RazorpayWebhookPayload) {
    const orderEntity = event.payload?.order?.entity;
    const paymentEntity = event.payload?.payment?.entity;
    const providerOrderId =
      typeof orderEntity?.id === "string"
        ? orderEntity.id
        : typeof paymentEntity?.order_id === "string"
          ? paymentEntity.order_id
          : null;

    if (!providerOrderId) {
      return;
    }

    const session = await this.prisma.billingCheckoutSession.findFirst({
      where: {
        providerOrderId
      }
    });

    if (!session) {
      return;
    }

    await this.markOrderPaid(session.id, {
      providerOrderId
    });
  }

  private async handleRazorpayPaymentFailed(event: RazorpayWebhookPayload) {
    const paymentEntity = event.payload?.payment?.entity;
    const providerOrderId = typeof paymentEntity?.order_id === "string" ? paymentEntity.order_id : null;

    if (!providerOrderId) {
      return;
    }

    const session = await this.prisma.billingCheckoutSession.findFirst({
      where: {
        providerOrderId
      },
      include: {
        order: true
      }
    });

    if (!session?.order) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: {
          id: session.order.id
        },
        data: {
          status: "payment_failed"
        }
      }),
      this.prisma.billingCheckoutSession.update({
        where: {
          id: session.id
        },
        data: {
          status: "failed"
        }
      })
    ]);
  }

  private async handleRazorpaySubscriptionUpdate(
    event: RazorpayWebhookPayload,
    status: SubscriptionStatus
  ) {
    const subscriptionEntity = event.payload?.subscription?.entity;
    const providerSubscriptionId =
      typeof subscriptionEntity?.id === "string" ? subscriptionEntity.id : null;

    if (!providerSubscriptionId) {
      return;
    }

    const record = await this.prisma.userSubscription.findFirst({
      where: {
        providerSubscriptionId
      }
    });

    if (!record) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.userSubscription.update({
        where: {
          id: record.id
        },
        data: {
          status,
          activatedAt:
            status === "active"
              ? record.activatedAt ?? toDateOrNull(subscriptionEntity?.current_start) ?? new Date()
              : record.activatedAt,
          cancelledAt:
            status === "cancelled"
              ? toDateOrNull(subscriptionEntity?.ended_at) ?? new Date()
              : null,
          currentPeriodStart: toDateOrNull(subscriptionEntity?.current_start),
          currentPeriodEnd: toDateOrNull(subscriptionEntity?.current_end)
        }
      }),
      this.prisma.billingCheckoutSession.updateMany({
        where: {
          subscriptionId: record.id
        },
        data: {
          providerSubscriptionId,
          status: status === "payment_failed" ? "failed" : "completed",
          completedAt: new Date()
        }
      })
    ]);
  }

  private async markOrderPaid(
    checkoutSessionId: string,
    providerIds: {
      providerOrderId?: string | null;
      providerSessionId?: string | null;
    }
  ) {
    const session = await this.prisma.billingCheckoutSession.findUnique({
      where: {
        id: checkoutSessionId
      },
      include: {
        order: {
          include: {
            items: true,
            user: true
          }
        }
      }
    });

    if (!session?.order) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: {
          id: session.order!.id
        },
        data: {
          status: "paid",
          paidAt: session.order!.paidAt ?? new Date()
        }
      });

      await tx.billingCheckoutSession.update({
        where: {
          id: session.id
        },
        data: {
          providerOrderId: providerIds.providerOrderId ?? session.providerOrderId,
          providerSessionId: providerIds.providerSessionId ?? session.providerSessionId,
          status: "completed",
          completedAt: session.completedAt ?? new Date()
        }
      });

      for (const item of session.order!.items) {
        if (!item.productId) {
          continue;
        }

        await tx.userProductEntitlement.upsert({
          where: {
            userId_productId: {
              userId: session.order!.userId,
              productId: item.productId
            }
          },
          update: {
            title: item.title,
            orderId: session.order!.id,
            grantedAt: new Date()
          },
          create: {
            userId: session.order!.userId,
            productId: item.productId,
            orderId: session.order!.id,
            title: item.title
          }
        });
      }

      await tx.cart.deleteMany({
        where: {
          userId: session.order!.userId,
          market: session.market
        }
      });
    });
  }

  private async getOrCreateCartRecord(userId: string, market: Market): Promise<CartWithItems> {
    await this.prisma.cart.upsert({
      where: {
        userId_market: {
          userId,
          market: market as PrismaMarket
        }
      },
      update: {},
      create: {
        userId,
        market: market as PrismaMarket
      }
    });

    return this.prisma.cart.findUniqueOrThrow({
      where: {
        userId_market: {
          userId,
          market: market as PrismaMarket
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                prices: {
                  where: {
                    isCurrent: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });
  }

  private toCatalogProduct(record: ProductWithPrices): CatalogProductDetail {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      tags: record.tags,
      coverImageUrl: record.coverImageUrl,
      purchaseLabel: record.purchaseLabel,
      status: record.status,
      publishedAt: record.publishedAt?.toISOString() ?? null,
      updatedAt: record.updatedAt.toISOString(),
      activePrices: record.prices
        .filter((price) => price.isCurrent)
        .map((price) => ({
          id: price.id,
          market: price.market as Market,
          currency: price.currency,
          amountMinor: price.amountMinor,
          isCurrent: price.isCurrent,
          createdAt: price.createdAt.toISOString()
        }))
    };
  }

  private toSubscriptionPlan(record: PlanWithPrices): SubscriptionPlanDetail {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      userPlan: record.userPlan,
      billingInterval: record.billingInterval,
      features: record.features,
      status: record.status,
      publishedAt: record.publishedAt?.toISOString() ?? null,
      updatedAt: record.updatedAt.toISOString(),
      activePrices: record.prices
        .filter((price) => price.isCurrent)
        .map((price) => ({
          id: price.id,
          market: price.market as Market,
          currency: price.currency,
          amountMinor: price.amountMinor,
          isCurrent: price.isCurrent,
          createdAt: price.createdAt.toISOString()
        }))
    };
  }

  private toCart(record: CartWithItems, market: Market): Cart {
    const items = record.items
      .map((item) => {
        const price = item.product.prices.find(
          (currentPrice) => currentPrice.isCurrent && currentPrice.market === (market as PrismaMarket)
        );

        if (!price || item.product.status !== "published") {
          return null;
        }

        return {
          id: item.id,
          productId: item.productId,
          productTitle: item.product.title,
          coverImageUrl: item.product.coverImageUrl,
          quantity: item.quantity,
          market,
          currency: price.currency,
          unitAmountMinor: price.amountMinor,
          totalAmountMinor: price.amountMinor * item.quantity
        };
      })
      .filter(Boolean) as Cart["items"];

    return {
      id: record.id,
      market,
      currency: items[0]?.currency ?? resolveBillingCurrency(market, apiConfig.brand),
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalAmountMinor: items.reduce((sum, item) => sum + item.totalAmountMinor, 0),
      updatedAt: record.updatedAt.toISOString(),
      items
    };
  }

  private toOrder(record: OrderWithItems): OrderRecord {
    return {
      id: record.id,
      status: record.status,
      provider: record.provider as OrderRecord["provider"],
      market: record.market as Market,
      currency: record.currency,
      amountMinor: record.amountMinor,
      userId: record.userId,
      userDisplayName: record.user.displayName,
      userEmail: record.user.email,
      checkoutSessionId: record.checkoutSession?.id ?? null,
      paidAt: record.paidAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      items: record.items.map((item) => ({
        id: item.id,
        productId: item.productId ?? "",
        title: item.title,
        quantity: item.quantity,
        unitAmountMinor: item.unitAmountMinor,
        totalAmountMinor: item.totalAmountMinor,
        coverImageUrl: item.coverImageUrl
      }))
    };
  }

  private toUserSubscription(record: SubscriptionWithPlan): UserSubscription {
    return {
      id: record.id,
      subscriptionPlanId: record.subscriptionPlanId,
      planName: record.planName,
      userPlan: record.userPlan,
      billingInterval: record.billingInterval,
      status: record.status,
      provider: record.provider as UserSubscription["provider"],
      market: record.market as Market,
      currency: record.currency,
      amountMinor: record.amountMinor,
      userId: record.userId,
      userDisplayName: record.user.displayName,
      userEmail: record.user.email,
      checkoutSessionId: record.checkoutSession?.id ?? null,
      currentPeriodStart: record.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: record.currentPeriodEnd?.toISOString() ?? null,
      activatedAt: record.activatedAt?.toISOString() ?? null,
      cancelledAt: record.cancelledAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private buildReturnUrls(checkoutSessionId: string, surface: "web" | "mobile") {
    if (surface === "mobile") {
      const scheme = runtimeEnv.mobileScheme.replace(/:\/\//g, "");
      return {
        successUrl: `${scheme}://checkout-return?status=success&checkoutSessionId=${encodeURIComponent(checkoutSessionId)}`,
        cancelUrl: `${scheme}://checkout-return?status=cancelled&checkoutSessionId=${encodeURIComponent(checkoutSessionId)}`
      };
    }

    return {
      successUrl: `${runtimeEnv.webUrl}/checkout/success?checkoutSessionId=${encodeURIComponent(checkoutSessionId)}&providerSessionId={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${runtimeEnv.webUrl}/checkout/cancel?checkoutSessionId=${encodeURIComponent(checkoutSessionId)}`
    };
  }

  private buildLaunchUrl(checkoutSessionId: string, token: string) {
    return `${runtimeEnv.webUrl}${platformConfig.billing.checkoutBridgePath}?checkoutSessionId=${encodeURIComponent(checkoutSessionId)}&token=${encodeURIComponent(token)}`;
  }

  private getSnapshotValue(snapshot: Prisma.JsonValue | null, key: string) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return "";
    }

    const value = (snapshot as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
  }

  private getNestedSnapshotValue(snapshot: Prisma.JsonValue | null, path: string[]) {
    let current: unknown = snapshot;

    for (const segment of path) {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        return "";
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return typeof current === "string" ? current : "";
  }

  private resolveCurrency(market: Market, currency?: string) {
    return currency?.trim().toUpperCase() || resolveBillingCurrency(market, apiConfig.brand);
  }

  private normalizeTags(values: string[]) {
    return values.map((value) => value.trim()).filter(Boolean);
  }

  private assertPriceMarkets(
    prices: Array<{
      market: Market;
    }>
  ) {
    const distinct = new Set(prices.map((price) => price.market));

    if (distinct.size !== prices.length) {
      throw new BadRequestException({
        code: "DUPLICATE_MARKET_PRICE",
        message: "Each market can have only one active price entry."
      });
    }
  }

  private async assertProductExists(productId: string) {
    const exists = await this.prisma.catalogProduct.findUnique({
      where: {
        id: productId
      },
      select: {
        id: true
      }
    });

    if (!exists) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "The requested product could not be found."
      });
    }
  }

  private async assertPlanExists(planId: string) {
    const exists = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: planId
      },
      select: {
        id: true
      }
    });

    if (!exists) {
      throw new NotFoundException({
        code: "PLAN_NOT_FOUND",
        message: "The requested subscription plan could not be found."
      });
    }
  }

  private async registerWebhookReceipt(
    provider: "stripe" | "razorpay",
    externalEventId: string,
    payload: Record<string, unknown>
  ) {
    try {
      await this.prisma.billingWebhookReceipt.create({
        data: {
          provider,
          externalEventId,
          payload: payload as Prisma.InputJsonValue
        }
      });
      return false;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return true;
      }

      throw error;
    }
  }

  private async markWebhookProcessed(provider: "stripe" | "razorpay", externalEventId: string) {
    await this.prisma.billingWebhookReceipt.updateMany({
      where: {
        provider,
        externalEventId
      },
      data: {
        processedAt: new Date()
      }
    });
  }

  private mapStripeSubscriptionStatus(status: string | undefined): SubscriptionStatus {
    switch (status) {
      case "active":
      case "trialing":
        return "active";
      case "canceled":
      case "incomplete_expired":
        return "cancelled";
      case "past_due":
      case "unpaid":
        return "payment_failed";
      default:
        return "pending";
    }
  }
}

function toDateOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000);
  }

  return null;
}
