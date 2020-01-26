import React from 'react'
import PropTypes from 'prop-types'
import { LoadingIndicator } from '../LoadingIndicator/LoadingIndicator'

export const LoadingButton = (props) => {
  return (
    <a href='#'
       className={props.className + ' btn btn--loading'}
       disabled={true}>
      <LoadingIndicator />
    </a>
  )
};

LoadingButton.propTypes = {
  className: PropTypes.string
};
