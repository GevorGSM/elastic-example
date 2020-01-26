import React, { useState } from 'react';
import { useNavigation } from 'react-navi';

import { LoadingButton } from '../components/LoadingButton/LoadingButton';
import { ErrorMessage } from '../components/Error/Error';
import { checkLogin, login } from '../auth';

export default function Login() {
  const [currentlySending, setCurrentlySending] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  function handleLoginCheck() {
    checkLogin()
      .then(isLoggedIn => {
        if (isLoggedIn) {
          return navigation.navigate('/search')
        } else {
          setIsInitialized(true);
        }
      })
  }

  function onSubmit(ev) {
    ev.preventDefault();
    const form = ev.target;
    const username = form.username.value;
    const password = form.password.value;

    setCurrentlySending(true);
    login(username, password).then(({ error }) => {
      setCurrentlySending(false);
      if (error) {
        setError('Something went wrong');
      } else {
        return navigation.navigate('/search');
      }
    });
  }

  if (!isInitialized) {
    handleLoginCheck();
    return null;
  }

  return (
    <div className='form-page__wrapper'>
      <div className='form-page__form-wrapper'>
        <div className='form-page__form-header'>
          <h2 className='form-page__form-heading'>Login</h2>
        </div>
        <form className='form' onSubmit={onSubmit}>
          {error ? <ErrorMessage error={error} /> : null}
          <div className='form__field-wrapper'>
            <input
              className='form__field-input'
              placeholder='frank.underwood'
              autoCapitalize='off'
              spellCheck='false'
              autoCorrect='off'
              id='username'
              type='text'
            />
            <label className='form__field-label' htmlFor='username'>
              Username
            </label>
          </div>
          <div className='form__field-wrapper'>
            <input
              className='form__field-input'
              placeholder='••••••••••'
              type='password'
              id='password'
            />
            <label className='form__field-label' htmlFor='password'>
              Password
            </label>
          </div>
          <div className='form__submit-btn-wrapper'>
            {currentlySending ? (
              <LoadingButton />
            ) : (
              <button className='form__submit-btn' type='submit'>
                Login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
