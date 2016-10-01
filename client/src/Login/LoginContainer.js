import React, { PropTypes } from 'react'
import { Router, Route, hashHistory, IndexRoute, Link } from 'react-router'
import SignUpForm from './SignUpForm.js'
import axios from 'axios'
import { connect } from 'react-redux'
import * as userActions from '../Redux/userReducer'


class LoginContainer extends React.Component {
	constructor(props, context) {
		super(props, context);
	}

	signUp(user, password, firstName, lastName, email) {
		console.log('User ',user, ' Password ', password, 'firstName', firstName, 'lastName', lastName, 'email', email);
		var userInfo = {username: user, password: password};


			let myHeaders = new Headers({'Content-Type': 'application/graphql; charset=utf-8'});
			let options = {

				method: 'POST',
				headers: myHeaders,
				body: `mutation
					{
						addUser(username: \"${user}\" password: \"${password}\" firstName: \"${firstName}\" lastName: \"${lastName}\" email: \"${email}\")
						{
									username
									password
									firstName
									lastName
									email
								}
					}`



			};
			fetch('/graphql', options).then((res) =>{
				return res.json().then((data) => {
					console.log(data);
					if(data === null) {
						this.setState({
							exist: true
						})
					} else {
						this.props.dispatch(userActions.userAuth(data));

						console.log('checking my data ------>', data);
						// console.log('checking router', this.context.router);
						// this.context.router.push('/profile');
						axios.post('/login', userInfo)
							.then((res) => {
								console.log('checking my data', res.data);
								this.props.dispatch(userActions.updateUser(res.data[0]));
								this.context.router.push('/upload');
							});
					}
				})
			})



	}


	render() {

		return(
			<div>
				<SignUpForm signUp={this.signUp.bind(this)}/>
			</div>
			)
	}
}

function mapStateToProps(state) {
  return {
    isLoggedIn: state.userReducer.isLoggedIn
  }
}

LoginContainer.contextTypes = {
  router: PropTypes.object.isRequired
}

export default connect(mapStateToProps)(LoginContainer)


