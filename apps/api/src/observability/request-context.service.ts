import { Injectable } from "@nestjs/common";
import type { Role } from "@platform/types";
import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContextState {
  requestId: string;
  method?: string;
  route?: string;
  userId?: string | null;
  role?: Role | null;
  brand?: string | null;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextState>();

  run<T>(state: RequestContextState, callback: () => T): T {
    return this.storage.run(state, callback);
  }

  get() {
    return this.storage.getStore();
  }

  getRequestId() {
    return this.storage.getStore()?.requestId;
  }

  update(patch: Partial<RequestContextState>) {
    const store = this.storage.getStore();

    if (!store) {
      return;
    }

    Object.assign(store, patch);
  }
}
