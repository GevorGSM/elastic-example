import React from 'react'
import { lazy, mount, redirect, route } from 'navi';
import Login from './Login/Login';

export const routes = mount({
  '/': route({
    title: 'Login',
    view: <Login />,
  }),
  '/search': lazy(() => import('./Search/search.route')),
  '*': redirect('/'),
});
