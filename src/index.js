import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

const request = require('request');
const qs = require('query-string');

class Picture extends React.Component {

    constructor(props) {
        super(props);
    }

    buildTagTable = () => {
        let table = []
        for (let tag of this.props.tags) {
            table.push(<td>{tag}</td>);
        }

        return table
    }

    render() {
        return (
            <div className="picture">
                <img src={this.props.url} alt={this.props.tags.join('_')}/>
                <table>
                        {this.buildTagTable()}
                </table>
            </div>
        )
    }
}


class Content extends React.Component {
    
    parsePics(comp, error, response, body) {
        console.log(comp);
        console.log(error);
        console.log(response);
        console.log(body);
        let res = JSON.parse(body);
        comp.setState({pics: null});
        let local_pics = [];
        for (let p of res) {
            local_pics.push(<Picture url={p.imgUrl} tags={p.tagList} />);
        }

        comp.setState({pics: local_pics});
    }

    constructor(props) {
        console.log("Content created with props : " + props);
        super(props);
        this.state = {
            pics: null
        };
        this.refresh(this.props.tags);
    }

    buildTagsQuery = (tags) => 'https://overdio.herokuapp.com/images/searchByTags?tags=' + tags.join('&tags='); 

    refresh(tags){
        let pf = (a, b, c) => {this.parsePics(this, a, b, c)};
        if (tags !== [] && tags !== "") {
           request(
               this.buildTagsQuery(tags),
               pf
           );
        }else{
           request(
               'https://overdio.herokuapp.com/images',
               pf
           );
        }
    }

    render() {
        return this.state.pics;
    }
}

class Query extends React.Component {

    constructor(props) {
        super(props);
        this.contentRef = React.createRef();
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            value: '',
            content: <Content ref={this.contentRef} tags="" />
        }
    }

    handleChange(event) {
        this.setState({value: event.target.value });
        let lastState = event.target.value;
        if (lastState[lastState.length - 1] === ' '){
            let query = lastState.substring(0, lastState.length - 1).split(' ');
            this.contentRef.current.refresh(query);
        }else if (lastState.trim() === ''){
            this.contentRef.current.refresh("");
        }
    }

    handleSubmit(event) {

    }


    render() {
        return ([
            <form onSubmit={this.handleSubmit}>
                <input  type="text" 
                        value={this.state.value} 
                        onChange= {this.handleChange} 
                        name="tag-query" 
                        className="input" />
            </form>,
            this.state.content
        ]
        );
    }
}

const tags_c = ['jojo'];
const element = <Query />;
ReactDOM.render(
    element,
    document.getElementById('root'));





// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
