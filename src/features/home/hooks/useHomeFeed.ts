import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import {
  filterFeedFixtures,
  feedFixtures,
  groupFixtures,
} from '../fixtures/homeFixtures';

export function useHomeFeed() {
  const [scenario, setScenario] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const groups = scenario === 2 ? [] : groupFixtures;
  const items = filterFeedFixtures(
    scenario === 2 ? [] : feedFixtures,
    groups,
    selectedGroupId,
  );
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
      'hardwareBackPress',
      () => {
        setFilterOpen(false);
        return true;
      },
    );
    return () => subscription.remove();
  }, [filterOpen]);
  const openArchive = () => {
    closeMenus();
    router.push('/archive');
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
