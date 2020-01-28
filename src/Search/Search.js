import React from 'react';
import { Layout } from '@elastic/react-search-ui-views/es/layouts';
import { Results, SearchBox, SearchProvider } from '@elastic/react-search-ui/es';

import { config } from '../helpers';

export const Search = () => (
  <SearchProvider config={config}>
    <div>
      <Layout
        bodyContent={<Results titleField="ListingTitle" urlField="ListingURL" />}
        header={<SearchBox />}
      />
    </div>
  </SearchProvider>
);
