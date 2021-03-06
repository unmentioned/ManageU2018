// Move firebase on to another folder.
import firebase from 'firebase'
import NavigationActions from '../Services/NavigationService'

function startAuthentication () {
  return {
    type: 'START_LOADING'
  }
}

function loginSuccess () {
  return {
    type: 'LOGIN_SUCCESS'
  }
}

function loginError () {
  return {
    type: 'LOGIN_ERROR',
    message: 'Incorrect email and password'
  }
}

function logoutSuccess () {
  return {
    type: 'LOGOUT_SUCCESS'
  }
}

function logoutError () {
  return {
    type: 'LOGOUT_ERROR'
  }
}

function loadUserStart () {
  return {
    type: 'FETCH_USER_START'
  }
}

/**
 * Action dispatcher for login
 * @param email user email
 * @param password user password
 * @returns {Function}
 */
export function login (email, password) {
  return (dispatch) => {
    dispatch(startAuthentication())

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(() => {
        dispatch(loginSuccess())
      })
      .catch(() => dispatch(loginError()))
  }
}

// TODO: Make register function.

export function logout () {
  return (dispatch) => {
    firebase.auth().signOut()
      .then(() => {
        dispatch(logoutSuccess())
        dispatch(NavigationActions.navigate('LoggedOutNav'))
      })
      // TODO: Change the catch
      .catch(dispatch(logoutError()))
  }
}

function viewSeminar () {
  return {
    type: 'VIEW_SEMINAR'
  }
}

// TODO: Check user type function (Call this after logged in or registered)
export function checkUserType () {
  // get user type instance from users database entity
}

// TODO: Need to check everytime updated as well, maybe we can do onChildChanged or onChildAdded.
export function fetchMySeminar () {
  const { currentUser } = firebase.auth()

  return (dispatch) => {
    dispatch(viewSeminar())
    // TODO: If we do this here now, we will have to update two entities when updating it.
    firebase.database().ref('seminars').orderByChild('ownerid').equalTo(currentUser.uid)
      .on('value', (snapshot) => {
        dispatch({ type: 'LOAD_MY_SEMINAR', payload: snapshot.val() })
      })
  }
}

// TODO: Use this but can't directly use this in app.js.
export function checkAuthenticated () {
  return (dispatch) => {
    dispatch(startAuthentication())
    firebase.auth().onAuthStateChanged((user) => {
      dispatch({ type: 'CHECK_AUTHENTICATED', payload: user })
      if (user != null) {
        // TODO: Dispatching the navigations here might not be right.
        dispatch(NavigationActions.navigate('RootLoggedInNavigation'))
      } else {
        dispatch(NavigationActions.navigate('RootLoggedOutNavigation'))
      }
    })
  }
}

// Load all user except admin
export function loadAllUser () {
  return (dispatch) => {
    dispatch(loadUserStart())
    let users = []
    firebase.database().ref('users').once('value')
      .then((snapshot) => {
        snapshot.forEach((childSnapshot) => {
          if (childSnapshot.val().role !== 'Admin') {
            const id = childSnapshot.key
            const value = childSnapshot.val()
            const user = { id, ...value }

            users.push(user)
          }
        })
      })
      .then(() => dispatch({ type: 'FETCH_USERS_LIST', payload: users }))
  }
}

export function addNewUser (email, name, role) {
  return (dispatch) => {
    firebase.database().ref('users').push({
      email, name, role
    }).then(() => {
      dispatch({ type: 'ADD_NEW_USER', payload: { email, name, role } })
    }).then(() => {
      dispatch(NavigationActions.navigate('UsersList'))
    }).catch(() => console.log('Failed!'))
  }
}

export function selectUser (userId) {
  return (dispatch) => {
    dispatch({ type: 'USER_SELECTED', payload: userId })
    dispatch(NavigationActions.push('EditUser'))
  }
}

export function saveUser ({ id, name, email, role }) {
  return (dispatch) => {
    firebase.database().ref(`users/${id}`)
      .set({ name, email, role })
      .then(() => {
        // SAVE USER IN THE DATABASE
        dispatch({ type: 'SAVE_USER' })
        // Navigate because we want to retrieve data directly again.
        // TODO: Instead of navigate, maybe we can update the state instead?
        dispatch(NavigationActions.navigate('UsersList'))
      })
  }
}

export function deleteUser (userId) {
  return (dispatch) => {
    firebase.database().ref(`users/${userId}`)
      .remove()
      .then(() => {
        // after remove, we dispatch the actions so that the redux state can be updated.
        dispatch(NavigationActions.navigate('UsersList'))
      })
  }
}
