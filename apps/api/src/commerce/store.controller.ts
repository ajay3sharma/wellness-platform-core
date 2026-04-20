import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import type {
  Cart,
  CatalogProductDetail,
  CatalogProductListItem,
  CheckoutLaunch,
  CheckoutSession,
  CreateCartCheckoutRequest,
  CreateSubscriptionCheckoutRequest,
  CurrentUser,
  EntitlementSnapshot,
  SubscriptionPlanDetail,
  UpdateCartItemRequest,
  UpsertCartItemRequest,
  UserSubscription,
  OrderRecord
} from "@platform/types";
import { CurrentUserDecorator } from "../common/current-user.decorator";
import { AccessTokenGuard } from "../auth/auth.guard";
import { CheckoutSessionLaunchQueryDto } from "./dto/checkout-session-launch-query.dto";
import { CreateCartCheckoutDto } from "./dto/create-cart-checkout.dto";
import { CreateSubscriptionCheckoutDto } from "./dto/create-subscription-checkout.dto";
import { StoreMarketQueryDto } from "./dto/store-market-query.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { UpsertCartItemDto } from "./dto/upsert-cart-item.dto";
import { CommerceService } from "./commerce.service";

@Controller("store")
export class StoreController {
  constructor(private readonly commerceService: CommerceService) {}

  @Get("products")
  listProducts(): Promise<CatalogProductListItem[]> {
    return this.commerceService.listPublishedProducts();
  }

  @Get("products/:productId")
  detailProduct(@Param("productId") productId: string): Promise<CatalogProductDetail> {
    return this.commerceService.getPublishedProductDetail(productId);
  }

  @Get("plans")
  listPlans(): Promise<SubscriptionPlanDetail[]> {
    return this.commerceService.listPublishedPlans();
  }

  @Get("checkout-sessions/:checkoutSessionId/launch")
  launchDetail(
    @Param("checkoutSessionId") checkoutSessionId: string,
    @Query() query: CheckoutSessionLaunchQueryDto
  ): Promise<CheckoutSession> {
    return this.commerceService.getCheckoutSessionLaunch(checkoutSessionId, query.token);
  }

  @UseGuards(AccessTokenGuard)
  @Get("cart")
  getCart(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: StoreMarketQueryDto
  ): Promise<Cart> {
    return this.commerceService.getCart(user, query.market);
  }

  @UseGuards(AccessTokenGuard)
  @Post("cart/items")
  upsertCartItem(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: UpsertCartItemDto
  ): Promise<Cart> {
    return this.commerceService.upsertCartItem(user, body as UpsertCartItemRequest);
  }

  @UseGuards(AccessTokenGuard)
  @Patch("cart/items/:itemId")
  updateCartItem(
    @CurrentUserDecorator() user: CurrentUser,
    @Param("itemId") itemId: string,
    @Body() body: UpdateCartItemDto
  ): Promise<Cart> {
    return this.commerceService.updateCartItem(user, itemId, body as UpdateCartItemRequest);
  }

  @UseGuards(AccessTokenGuard)
  @Delete("cart/items/:itemId")
  removeCartItem(
    @CurrentUserDecorator() user: CurrentUser,
    @Param("itemId") itemId: string
  ): Promise<Cart> {
    return this.commerceService.removeCartItem(user, itemId);
  }

  @UseGuards(AccessTokenGuard)
  @Post("checkout-sessions/cart")
  createCartCheckout(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: CreateCartCheckoutDto
  ): Promise<CheckoutLaunch> {
    return this.commerceService.createCartCheckoutSession(user, body as CreateCartCheckoutRequest);
  }

  @UseGuards(AccessTokenGuard)
  @Post("checkout-sessions/subscription")
  createSubscriptionCheckout(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: CreateSubscriptionCheckoutDto
  ): Promise<CheckoutLaunch> {
    return this.commerceService.createSubscriptionCheckoutSession(
      user,
      body as CreateSubscriptionCheckoutRequest
    );
  }

  @UseGuards(AccessTokenGuard)
  @Get("orders/me")
  listMyOrders(@CurrentUserDecorator() user: CurrentUser): Promise<OrderRecord[]> {
    return this.commerceService.listOrdersForUser(user);
  }

  @UseGuards(AccessTokenGuard)
  @Get("subscription/me")
  getMySubscription(@CurrentUserDecorator() user: CurrentUser): Promise<UserSubscription | null> {
    return this.commerceService.getSubscriptionForUser(user);
  }

  @UseGuards(AccessTokenGuard)
  @Get("entitlements/me")
  getMyEntitlements(@CurrentUserDecorator() user: CurrentUser): Promise<EntitlementSnapshot> {
    return this.commerceService.getEntitlements(user);
  }
}
