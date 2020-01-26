import React from 'react';
import { mount, route } from 'navi';

import { Search } from './Search';

export default mount({
  '/': route({
    getTitle: () => 'Search',
    view: <Search />,
  }),
});
