import React, { useState } from 'react';
import { useNavigation } from 'react-navi';
import { Layout } from '@elastic/react-search-ui-views/es/layouts';
import { Results, SearchBox, SearchProvider } from '@elastic/react-search-ui/es';

import { config } from '../helpers';
import { checkLogin } from '../auth';

export const Search = () => {
  const [isInitialized, setIsInitialized] = useState(true);
  let navigation = useNavigation();

  function handleLoginCheck() {
    checkLogin()
      .then(isLoggedIn => {
        if (isLoggedIn) {
          setIsInitialized(true);
        } else {
          return navigation.navigate('/')
        }
      })
  }

  if (!isInitialized) {
    // handleLoginCheck();
    return null;
  }

  return (
    <SearchProvider config={config}>
      <div>
        <Layout
          bodyContent={<Results titleField="ListingTitle" urlField="ListingURL" />}
          header={<SearchBox />}
        />
      </div>
    </SearchProvider>
  );
};
