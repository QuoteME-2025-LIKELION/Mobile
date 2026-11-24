import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { BackHandler } from "react-native";
import { homeResource } from "../stores/homeResource";
import { useHomeData } from "../stores/useHomeData";
export function useHomeFeed() {
  const state = useHomeData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  useFocusEffect(
    useCallback(() => {
      void homeResource.load();
    }, [])
  );
  const closeMenus = () => {
    setFilterOpen(false);
    setTagMenuOpen(false);
  };
  useEffect(() => {
    if (!filterOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setFilterOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [filterOpen]);
  return {
    status: state.status,
    date: state.date,
    profile: state.data?.profile ?? null,
    myQuote: state.data?.myQuote ?? null,
    items: state.data?.items ?? [],
    groups: state.data?.groups ?? [],
    selectedGroupId: state.groupId,
    hasUnreadNotifications: (state.data?.unreadCount ?? 0) > 0,
    drawerOpen,
    tagMenuOpen,
    setTagMenuOpen,
    filterOpen,
    closeMenus,
    retry: () => {
      void homeResource.load();
    },
    openArchive: () => {
      closeMenus();
      router.push("/archive");
    },
    openNotifications: () => {
      closeMenus();
      router.push({
        pathname: "/notification",
        params: { written: state.data?.myQuote ? "1" : "0" },
      });
    },
    openCreateGroup: () => {
      closeMenus();
      router.push("/friend-group/create");
    },
    openDrawer: () => {
      closeMenus();
      setDrawerOpen(true);
    },
    closeDrawer: () => setDrawerOpen(false),
    closeFilter: () => setFilterOpen(false),
    closeTags: () => setTagMenuOpen(false),
    toggleFilter: () => {
      setTagMenuOpen(false);
      setFilterOpen((value) => !value);
    },
    selectGroup: (id: number | null) => {
      closeMenus();
      void homeResource.load(id);
    },
  };
}
