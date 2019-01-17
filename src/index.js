import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

const request = require('request');

class Mode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mode: this.props.mode
        }
        this.changeModeToSearch = this.changeModeToSearch.bind(this);
        this.changeModeToUpload = this.changeModeToUpload.bind(this);
    }

    changeModeToSearch() {
        this.setState({mode: "search"});
    }

    changeModeToUpload() {
        this.setState({mode: "upload"});
    }

    prepareSearchBody = () => <Query />;

    prepareUploadBody = () => <Upload />;

    render() {
        let mainBody = null;
        if (this.state.mode === "search"){
           mainBody = this.prepareSearchBody();
        }
        if (this.state.mode === "upload") {
            mainBody = this.prepareUploadBody();
        }

            this.searchEnabled = (this.state.mode === "upload" ? false : true);
            this.uploadEnabled = (this.state.mode === "search" ? false : true);
        return (
        [<div className="navbar">
            <button type="button" 
                disabled={this.searchEnabled} 
                onClick={this.changeModeToSearch}>
                Search
            </button>

            <button type="button"
                disabled={this.uploadEnabled} 
                onClick={this.changeModeToUpload}>
                Upload
            </button>
        </div>,
        mainBody]
        );
    }
}

class Picture extends React.Component {

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
            </div>
        )
    }
}

class Content extends React.Component {

    parsePics(comp, error, response, body) {
        console.log(error);
        if (error !== null){
            comp.setState({pics: error });
        }else{
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
    }

    constructor(props) {
        console.log("Content created with props : " + props);
        super(props);
        this.state = {
            pics: null
        };
        this.refresh(this.props.tags);
    }

    buildTagsQuery = (tags) => 
        'https://overdio.herokuapp.com/images/searchByTags?tags=' + tags.join('&tags='); 

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
            content:    <div className = "content-space">
            <Content ref={this.contentRef} tags="" />
            </div>
        }
    }

    handleChange(event) {
        this.setState({value: event.target.value });
        let lastState = event.target.value;
        if (lastState === ''){
            this.contentRef.current.refresh("");
        }else if (lastState[lastState.length - 1] === ' '){
            lastState = lastState.trim();
            let query = lastState.substring(0, lastState.length).split(' ');
            this.contentRef.current.refresh(query);
        }
    }

    handleSubmit(event) {
        event.preventDefault();
        this.setState({value: this.state.value.trim() + " "});
        this.work();
    }

    work(){
        let lastState = this.state.value.trim() + " ";
        if (lastState.trim() === ''){
            this.contentRef.current.refresh("");
        }else if (lastState[lastState.length - 1] === ' '){
            let query = lastState.substring(0, lastState.length - 1).split(' ');
            this.contentRef.current.refresh(query);
        }
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

class Upload extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            pic: null,
            tags: "tagme"
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleTagsChange = this.handleTagsChange.bind(this);
    }

    handleChange(event) {
        if (this.state.pic != null){
            URL.revokeObjectURL(this.state.pic);
        }
        this.setState({
            pic: URL.createObjectURL(event.target.files[0])
        });
    }

    handleTagsChange(event) {
        this.setState({tags: event.target.value});
    }


    sendRequest(tags, content) {
        let formdata = {
            method: 'POST',
            uri: 'https://overdio.herokuapp.com/images/upload',
            headers: {
                'content-type': 'multipart/form-data',
            },
            multipart: {
                chunked: false,
                data:[
                    {
                        'Content-Disposition': 'form-data; name="tagList"',
                        body : tags
                    },
                    {
                        'Content-Disposition': 'form-data; name="data"',
                        body: content.target.result
                    }
                ]
            },
       };

        request(formdata,
            function (err, resp, body) {console.log(err + "-" + resp + "-" + body);});
    }

    handleSubmit(event) {
        event.preventDefault();
        let tags = this.state.tags.trim();
        console.log(tags);
        let data = document.getElementById('pic').files[0];
        let fr = new window.FileReader();
        fr.onload = (e) => this.sendRequest(tags, e);
        fr.readAsArrayBuffer(data);
    }

    render() {
        let imgComp = null;
        if (this.state.pic != null){
            imgComp = <img className="preview" src={this.state.pic} alt="preview"/>;
        }
        let hint = 'Hint: If you\'re lazy, set a "tagme" tag and wait for others to fill them for you.';
        return (
            <div className="content-space tac form">
            {imgComp}
            <form onSubmit={this.handleSubmit} id="upload-form">
            <tr><td className="lab-field"> 
            <label for="pic">Picture to upload : </label>
            </td><td>
            <input type="file" id="pic" onChange={this.handleChange}/>
            </td></tr>
            <tr><td className="lab-field">
            <label for="tagsarea">Tags (separated by whitespaces): </label>
            </td><td>
            <textarea
                id="tagsarea"
                value={this.state.tags}
                onChange={this.handleTagsChange}
                name="tag-upload"
                className="textarea"
                form="upload-form"
                rows="5"
                cols="80"
            ></textarea>
            </td></tr>
            <tr><td></td><td>
            <input type="submit" onClick={this.handleSubmit} value="Upload !"/>
            </td></tr>
            </form>
            <i>{hint}</i>
            </div>
        );
    }
}

//const element = <Query />;
const element = <Mode mode="search"/>;
ReactDOM.render(
    element,
    document.getElementById('root'));





// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
