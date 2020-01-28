import React from 'react'
import { lazy, mount, redirect } from 'navi';

export const routes = mount({
  '/': lazy(() => import('./Search/search.route')),
  '*': redirect('/'),
});
