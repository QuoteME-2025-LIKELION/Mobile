import { resetModerationFixtures } from "@/features/moderation/stores/moderationStore";
import { resetNotificationFixtures } from "@/features/notifications/stores/notificationStore";
import { getApiBaseUrl } from "@/api/apiConfig";
import { createApiClient } from "@/api/createApiClient";
import { createSessionManager } from "./createSessionManager";
import { tokenStorage } from "./tokenStorage";
export const session = createSessionManager(
  createApiClient(getApiBaseUrl),
  tokenStorage,
  () => {
    resetModerationFixtures();
    resetNotificationFixtures();
  }
);
