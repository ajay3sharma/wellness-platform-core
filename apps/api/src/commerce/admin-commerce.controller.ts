import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type {
  CatalogProductDetail,
  CatalogProductListItem,
  OrderRecord,
  SaveCatalogProductRequest,
  SaveSubscriptionPlanRequest,
  SubscriptionPlanDetail,
  UserSubscription
} from "@platform/types";
import { AccessTokenGuard } from "../auth/auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { CommerceService } from "./commerce.service";
import { SaveCatalogProductDto } from "./dto/save-catalog-product.dto";
import { SaveSubscriptionPlanDto } from "./dto/save-subscription-plan.dto";

@Controller("admin/commerce")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminCommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  @Get("products")
  listProducts(): Promise<CatalogProductListItem[]> {
    return this.commerceService.listAdminProducts();
  }

  @Post("products")
  createProduct(@Body() body: SaveCatalogProductDto): Promise<CatalogProductDetail> {
    return this.commerceService.createProduct(body as SaveCatalogProductRequest);
  }

  @Patch("products/:productId")
  updateProduct(
    @Param("productId") productId: string,
    @Body() body: SaveCatalogProductDto
  ): Promise<CatalogProductDetail> {
    return this.commerceService.updateProduct(productId, body as SaveCatalogProductRequest);
  }

  @Post("products/:productId/publish")
  publishProduct(@Param("productId") productId: string): Promise<CatalogProductDetail> {
    return this.commerceService.setProductStatus(productId, "published");
  }

  @Post("products/:productId/unpublish")
  unpublishProduct(@Param("productId") productId: string): Promise<CatalogProductDetail> {
    return this.commerceService.setProductStatus(productId, "draft");
  }

  @Get("plans")
  listPlans(): Promise<SubscriptionPlanDetail[]> {
    return this.commerceService.listAdminPlans();
  }

  @Post("plans")
  createPlan(@Body() body: SaveSubscriptionPlanDto): Promise<SubscriptionPlanDetail> {
    return this.commerceService.createPlan(body as SaveSubscriptionPlanRequest);
  }

  @Patch("plans/:planId")
  updatePlan(
    @Param("planId") planId: string,
    @Body() body: SaveSubscriptionPlanDto
  ): Promise<SubscriptionPlanDetail> {
    return this.commerceService.updatePlan(planId, body as SaveSubscriptionPlanRequest);
  }

  @Post("plans/:planId/publish")
  publishPlan(@Param("planId") planId: string): Promise<SubscriptionPlanDetail> {
    return this.commerceService.setPlanStatus(planId, "published");
  }

  @Post("plans/:planId/unpublish")
  unpublishPlan(@Param("planId") planId: string): Promise<SubscriptionPlanDetail> {
    return this.commerceService.setPlanStatus(planId, "draft");
  }

  @Get("orders")
  listOrders(): Promise<OrderRecord[]> {
    return this.commerceService.listAdminOrders();
  }

  @Get("orders/:orderId")
  detailOrder(@Param("orderId") orderId: string): Promise<OrderRecord> {
    return this.commerceService.getAdminOrder(orderId);
  }

  @Get("subscriptions")
  listSubscriptions(): Promise<UserSubscription[]> {
    return this.commerceService.listAdminSubscriptions();
  }
}
