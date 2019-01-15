import React, { Component } from 'react';
import logo from './jovid.png';
import './App.css';
const request = require('request');
var log = null;
class Picture extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            url: "https://cdn.bulbagarden.net/upload/f/f5/399Bidoof.png",
            tags: ["bidoof", "pokemon"],
            val: null
        };
    }
    render() {
        return (
            <div className="picture">
                <img src={this.state.url} />
                <p>{this.state.tags}</p>
            </div>
        )
    }
}


class Content extends React.Component {
    
    var pics = [];
    constructor(props) {
        super(props);
        this.state = {
            tags: ["bidoof"]
        };

        pics =//continue here 
    }

    render() {
        return 
    }
}

class App extends Component {
  
    work(error, response, body) {
        console.log(body);
        log = body;
    }

    render() {
        request('https://overdiotest.herokuapp.com/images?tags=bidoof', this.work);
         return (
            <div className="App">
            <Picture val="first" />
            <Picture val="second" />
            {log}
        </div>
    );
  }
}

export default App;
