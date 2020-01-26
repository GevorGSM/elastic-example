import { API_URL } from './helpers';

function getTermFilterValue(field, fieldValue) {
  // We do this because if the value is a boolean value, we need to apply
  // our filter differently. We're also only storing the string representation
  // of the boolean value, so we need to convert it to a Boolean.

  // TODO We need better approach for boolean values
  if (fieldValue === "false" || fieldValue === "true") {
    return { [field]: fieldValue === "true" };
  }

  return { [`${field}.keyword`]: fieldValue };
}

function getTermFilter(filter) {
  if (filter.type === "any") {
    return {
      bool: {
        should: [
          filter.values.map(filterValue => ({
            term: getTermFilterValue(filter.field, filterValue)
          }))
        ],
        minimum_should_match: 1
      }
    };
  } else if (filter.type === "all") {
    return {
      bool: {
        filter: [
          filter.values.map(filterValue => ({
            term: getTermFilterValue(filter.field, filterValue)
          }))
        ]
      }
    };
  }
}

function getRangeFilter(filter) {
  if (filter.type === "any") {
    return {
      bool: {
        should: [
          filter.values.map(filterValue => ({
            range: {
              [filter.field]: {
                ...(filterValue.to && { lt: filterValue.to }),
                ...(filterValue.to && { gt: filterValue.from })
              }
            }
          }))
        ],
        minimum_should_match: 1
      }
    };
  } else if (filter.type === "all") {
    return {
      bool: {
        filter: [
          filter.values.map(filterValue => ({
            range: {
              [filter.field]: {
                ...(filterValue.to && { lt: filterValue.to }),
                ...(filterValue.to && { gt: filterValue.from })
              }
            }
          }))
        ]
      }
    };
  }
}

export const buildRequestFilter = (filters) => {
  if (!filters) return;

  filters = filters.reduce((acc, filter) => {
    if (["states", "world_heritage_site"].includes(filter.field)) {
      return [...acc, getTermFilter(filter)];
    }
    if (["acres", "visitors"].includes(filter.field)) {
      return [...acc, getRangeFilter(filter)];
    }
    return acc;
  }, []);

  if (filters.length < 1) return;
  return filters;
}
// ----------------------------------------------
function buildFrom(current, resultsPerPage) {
  if (!current || !resultsPerPage) return;
  return (current - 1) * resultsPerPage;
}

function buildSort(sortDirection, sortField) {
  if (sortDirection && sortField) {
    return [{ [`${sortField}.keyword`]: sortDirection }];
  }
}

function buildMatch(searchTerm) {
  return searchTerm
    ? {
      multi_match: {
        query: searchTerm,
        fields: ["AddressCommonsFullStreetAddress", "AddressCommonsPostalCode", "AddressCommonsCity"]
      }
    }
    : { match_all: {} };
}

/*
  Converts current application state to an Elasticsearch request.
  When implementing an onSearch Handler in Search UI, the handler needs to take the
  current state of the application and convert it to an API request.
  For instance, there is a "current" property in the application state that you receive
  in this handler. The "current" property represents the current page in pagination. This
  method converts our "current" property to Elasticsearch's "from" parameter.
  This "current" property is a "page" offset, while Elasticsearch's "from" parameter
  is a "item" offset. In other words, for a set of 100 results and a page size
  of 10, if our "current" value is "4", then the equivalent Elasticsearch "from" value
  would be "40". This method does that conversion.
  We then do similar things for searchTerm, filters, sort, etc.
*/
export const buildRequest = (state) => {
  const {
    current,
    filters,
    resultsPerPage,
    searchTerm,
    sortDirection,
    sortField
  } = state;

  const sort = buildSort(sortDirection, sortField);
  const match = buildMatch(searchTerm);
  const size = resultsPerPage;
  const from = buildFrom(current, resultsPerPage);
  const filter = buildRequestFilter(filters);

  const body = {
    // Static query Configuration
    // --------------------------
    // https://www.elastic.co/guide/en/elasticsearch/reference/7.x/search-request-highlighting.html
    highlight: {
      fragment_size: 200,
      number_of_fragments: 1,
      fields: {
        title: {},
        description: {}
      }
    },
    //https://www.elastic.co/guide/en/elasticsearch/reference/7.x/search-request-source-filtering.html#search-request-source-filtering
    _source: [
      "id",
      "ListingTitle",
      "AddressCommonsFullStreetAddress",
      "AddressCommonsCity",
      "AddressCommonsStateOrProvince",
      "AddressCommonsPostalCode",
      "ListPriceText",
      "ProviderName",
      "ProviderURL",
      "ListingURL",
      "LeadRoutingEmail",
      "OfficesOfficeOfficeEmail",
      "BrokerageEmail",
      "BrokerageWebsiteURL",
      "BrokeragePhone",
      "BrokerageName",
      "LocationLatitude",
      "LocationLongitude",
      "LocationDirections",
      "LocationCounty",
      "DisclaimerText",
      "ListingCategory",
      "ListingStatus",
      "PropertyTypeOtherDescription",
      "PropertyTypeText",
    ],
    aggs: {
      states: { terms: { field: "states.keyword", size: 30 } },
      world_heritage_site: {
        terms: { field: "world_heritage_site" }
      },
      visitors: {
        range: {
          field: "visitors",
          ranges: [
            { from: 0.0, to: 10000.0, key: "0 - 10000" },
            { from: 10001.0, to: 100000.0, key: "10001 - 100000" },
            { from: 100001.0, to: 500000.0, key: "100001 - 500000" },
            { from: 500001.0, to: 1000000.0, key: "500001 - 1000000" },
            { from: 1000001.0, to: 5000000.0, key: "1000001 - 5000000" },
            { from: 5000001.0, to: 10000000.0, key: "5000001 - 10000000" },
            { from: 10000001.0, key: "10000001+" }
          ]
        }
      },
      acres: {
        range: {
          field: "acres",
          ranges: [
            { from: -1.0, key: "Any" },
            { from: 0.0, to: 1000.0, key: "Small" },
            { from: 1001.0, to: 100000.0, key: "Medium" },
            { from: 100001.0, key: "Large" }
          ]
        }
      }
    },

    // Dynamic values based on current Search UI state
    // --------------------------
    // https://www.elastic.co/guide/en/elasticsearch/reference/7.x/full-text-queries.html
    query: {
      bool: {
        must: [match],
        ...(filter && { filter })
      }
    },
    // https://www.elastic.co/guide/en/elasticsearch/reference/7.x/search-request-sort.html
    ...(sort && { sort }),
    // https://www.elastic.co/guide/en/elasticsearch/reference/7.x/search-request-from-size.html
    ...(size && { size }),
    ...(from && { from })
  };

  return body;
};

// --------------------------------------------------
export const runRequest = async (body) => {
  const response = await fetch(`${API_URL}/listhub/_search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return response.json();
};

// ------------------------------------------------------
function combineAggregationsFromResponses(responses) {
  return responses.reduce((acc, response) => {
    return {
      ...acc,
      ...response.aggregations
    };
  }, {});
}

// To calculate a disjunctive facet correctly, you need to calculate the facet counts as if the filter was
// not applied. If you did not do this, list of facet values would collapse to just one value, which is
// whatever you have filtered on in that facet.
function removeFilterByName(state, facetName) {
  return {
    ...state,
    filters: state.filters.filter(f => f.field !== facetName)
  };
}

function removeAllFacetsExcept(body, facetName) {
  return {
    ...body,
    aggs: {
      [facetName]: body.aggs[facetName]
    }
  };
}

function changeSizeToZero(body) {
  return {
    ...body,
    size: 0
  };
}

async function getDisjunctiveFacetCounts(state, disunctiveFacetNames) {
  const responses = await Promise.all(
    // Note that this could be optimized by *not* executing a request
    // if not filter is currently applied for that field. Kept simple here for clarity.
    disunctiveFacetNames.map(facetName => {
      let newState = removeFilterByName(state, facetName);
      let body = buildRequest(newState);
      body = changeSizeToZero(body);
      body = removeAllFacetsExcept(body, facetName);
      return runRequest(body);
    })
  );
  return combineAggregationsFromResponses(responses);
}

/**
 * This function will re-calculate facets that need to be considered
 * "disjunctive" (also known as "sticky"). Calculating sticky facets correctly
 * requires a second query for each sticky facet.
 *
 * @param {*} json
 * @param {*} state
 * @param {string[]} disunctiveFacetNames
 *
 * @return {Promise<Object>} A map of updated aggregation counts for the specified facet names
 */
export const applyDisjunctiveFaceting = async (
  json,
  state,
  disunctiveFacetNames
) => {
  const disjunctiveFacetCounts = await getDisjunctiveFacetCounts(
    state,
    disunctiveFacetNames
  );

  return {
    ...json,
    aggregations: {
      ...json.aggregations,
      ...disjunctiveFacetCounts
    }
  };
};
// -----------------------------------------------
function getValueFacet(aggregations, fieldName) {
  if (
    aggregations &&
    aggregations[fieldName] &&
    aggregations[fieldName].buckets &&
    aggregations[fieldName].buckets.length > 0
  ) {
    return [
      {
        field: fieldName,
        type: "value",
        data: aggregations[fieldName].buckets.map(bucket => ({
          // Boolean values and date values require using `key_as_string`
          value: bucket.key_as_string || bucket.key,
          count: bucket.doc_count
        }))
      }
    ];
  }
}

function getRangeFacet(aggregations, fieldName) {
  if (
    aggregations &&
    aggregations[fieldName] &&
    aggregations[fieldName].buckets &&
    aggregations[fieldName].buckets.length > 0
  ) {
    return [
      {
        field: fieldName,
        type: "range",
        data: aggregations[fieldName].buckets.map(bucket => ({
          // Boolean values and date values require using `key_as_string`
          value: {
            to: bucket.to,
            from: bucket.from,
            name: bucket.key
          },
          count: bucket.doc_count
        }))
      }
    ];
  }
}

export const buildStateFacets = (aggregations) => {
  const states = getValueFacet(aggregations, "states");
  const world_heritage_site = getValueFacet(
    aggregations,
    "world_heritage_site"
  );
  const visitors = getRangeFacet(aggregations, "visitors");
  const acres = getRangeFacet(aggregations, "acres");

  const facets = {
    ...(states && { states }),
    ...(world_heritage_site && { world_heritage_site }),
    ...(visitors && { visitors }),
    ...(acres && { acres })
  };

  if (Object.keys(facets).length > 0) {
    return facets;
  }
};

// ----------------------------------------------------

function buildTotalPages(resultsPerPage, totalResults) {
  if (!resultsPerPage) return 0;
  if (totalResults === 0) return 1;
  return Math.ceil(totalResults / resultsPerPage);
}

function buildTotalResults(hits) {
  return hits.total.value;
}

function getHighlight(hit, fieldName) {
  if (hit._source.title === "Rocky Mountain" && fieldName === "title") {
    window.hit = hit;
    window.fieldName = fieldName;
  }
  if (
    !hit.highlight ||
    !hit.highlight[fieldName] ||
    hit.highlight[fieldName].length < 1
  ) {
    return;
  }

  return hit.highlight[fieldName][0];
}

function buildResults(hits) {
  const addEachKeyValueToObject = (acc, [key, value]) => ({
    ...acc,
    [key]: value
  });

  const toObject = (value, snippet) => {
    return { raw: value, ...(snippet && { snippet }) };
  };

  return hits.map(record => {
    return Object.entries(record._source)
      .map(([fieldName, fieldValue]) => [
        fieldName,
        toObject(fieldValue, getHighlight(record, fieldName))
      ])
      .reduce(addEachKeyValueToObject, {});
  });
}

/*
  Converts an Elasticsearch response to new application state
  When implementing an onSearch Handler in Search UI, the handler needs to convert
  search results into a new application state that Search UI understands.
  For instance, Elasticsearch returns "hits" for search results. This maps to
  the "results" property in application state, which requires a specific format. So this
  file iterates through "hits" and reformats them to "results" that Search UI
  understands.
  We do similar things for facets and totals.
*/
export const buildState = (response, resultsPerPage) => {
  const results = buildResults(response.hits.hits);
  const totalResults = buildTotalResults(response.hits);
  const totalPages = buildTotalPages(resultsPerPage, totalResults);
  const facets = buildStateFacets(response.aggregations);

  return {
    results,
    totalPages,
    totalResults,
    ...(facets && { facets })
  };
};
// -------------------------------------------------------------
