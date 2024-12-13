import React from 'react';
import { Stack } from "expo-router";
import InvestorLayout from './layout';

export default function Layout() {
  return (
    <InvestorLayout>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </InvestorLayout>
  );
}
