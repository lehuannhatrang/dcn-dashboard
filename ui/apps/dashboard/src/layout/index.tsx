/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { FC, ReactNode, useState } from 'react';
import { Layout as AntdLayout } from 'antd';
import { Outlet, Navigate } from 'react-router-dom';
import Header from './header';
import Sidebar from './sidebar';
import { cn } from '@/utils/cn.ts';
import { useAuth } from '@/components/auth';
import { getSidebarWidth } from '@/utils/i18n';
import { useWindowSize } from "@uidotdev/usehooks";
import ChatProvider from '@/components/chat';

const { Sider: AntdSider, Content: AntdContent } = AntdLayout;

export const MainLayout: FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { authenticated, initToken } = useAuth();
  const { width } = useWindowSize();
  const isSmallScreen = width !== null && width <= 768;
  const isCollapsed = isSmallScreen || collapsed;

  if (!authenticated) {
    return <Navigate to="/login" />;
  } else if (!initToken) {
    return <Navigate to="/init-token" />;
  }

  return (
    <ChatProvider hideOnPaths={['/login', '/init-token']}>
      <Header />
      <AntdLayout className={cn('h-[calc(100vh-48px)]', 'overflow-hidden', 'flex')}>
        <AntdSider
          width={getSidebarWidth()}
          collapsible
          collapsed={isCollapsed}
          breakpoint="lg"
          onCollapse={(collapsed) => setCollapsed(collapsed)}
          // trigger={null}
        >
          <Sidebar collapsed={isCollapsed} />
        </AntdSider>
        <AntdContent >
          <Outlet />
        </AntdContent>
      </AntdLayout>
    </ChatProvider>
  );
};

export interface IOnlyHeaderLayout {
  children?: ReactNode;
}

export const OnlyHeaderLayout: FC<IOnlyHeaderLayout> = ({ children }) => {
  return (
    <>
      <Header />
      <AntdLayout className={cn('h-[calc(100vh-48px)]')}>
        <AntdContent>{children}</AntdContent>
      </AntdLayout>
    </>
  );
};
