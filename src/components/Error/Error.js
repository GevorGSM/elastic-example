import React from 'react'

export const ErrorMessage = (props) => {
  return (
    <div className='form__error-wrapper js-form__err-animation'>
      <p className='form__error'>
        {props.error}
      </p>
    </div>
  )
};
