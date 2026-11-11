import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useModerationState } from "@/features/moderation/stores/moderationStore";
import { BackHandler } from "react-native";
import {
  filterFeedFixtures,
  feedFixtures,
  groupFixtures,
} from "../fixtures/homeFixtures";

export function useHomeFeed() {
  const [scenario, setScenario] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const groups = scenario === 2 ? [] : groupFixtures;
  const moderation = useModerationState();
  const removedNames = feedFixtures
    .filter((item) => moderation.formerFriendIds.includes(item.memberId))
    .map((item) => item.nickname);
  const items = filterFeedFixtures(
    scenario === 2
      ? []
      : feedFixtures.filter(
          (item) =>
            !moderation.blocked.some((member) => member.id === item.memberId) &&
            (selectedGroupId !== null ||
              !moderation.formerFriendIds.includes(item.memberId))
        ),
    groups,
    selectedGroupId
  ).map((item) => ({
    ...item,
    tags: item.tags.filter((name) => !removedNames.includes(name)),
  }));
  const closeMenus = () => {
    setFilterOpen(false);
    setTagMenuOpen(false);
  };
  const nextScenario = () => {
    closeMenus();
    setSelectedGroupId(null);
    setScenario((value) => (value + 1) % 3);
  };
  useEffect(() => {
    if (!filterOpen) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setFilterOpen(false);
        return true;
      }
    );
    return () => subscription.remove();
  }, [filterOpen]);
  const openArchive = () => {
    closeMenus();
    router.push("/archive");
  };
  const openDrawer = () => {
    closeMenus();
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);
  const closeFilter = () => setFilterOpen(false);
  const closeTags = () => setTagMenuOpen(false);
  const toggleFilter = () => {
    setTagMenuOpen(false);
    setFilterOpen((value) => !value);
  };
  const selectGroup = (id: number | null) => {
    setSelectedGroupId(id);
    setFilterOpen(false);
  };
  return {
    removedNames,
    scenario,
    drawerOpen,
    tagMenuOpen,
    setTagMenuOpen,
    filterOpen,
    selectedGroupId,
    groups,
    items,
    closeMenus,
    nextScenario,
    openArchive,
    openDrawer,
    closeDrawer,
    closeFilter,
    closeTags,
    toggleFilter,
    selectGroup,
  };
}
