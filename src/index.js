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

    prepareUploadBody = () => <Upload callback={this.changeModeToSearch.bind(this)}/>;

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

    constructor(props) {
        super(props);
        this.state = {
            showPopup: false,
        }
    }

    buildTagTable = () => {
        let table = []
        for (let tag of this.props.tags) {
            table.push(<td>{tag}</td>);
        }

        return table
    }


    togglePopupWOEvent() {
        this.setState({showPopup: !this.state.showPopup});
    }

    togglePopup(e) {
        e.preventDefault();
        this.setState({showPopup: !this.state.showPopup});
    }

    render() {
        let f = this.togglePopup.bind(this);
        let f2 = this.togglePopupWOEvent.bind(this);
        return ([
            <div className="picture">
            <a href="#" onClick={this.togglePopup.bind(this)}>
            <img src={this.props.url} title={this.props.tags.join(' ')} alt={this.props.tags.join(' ')}/>
            </a>
            </div>,
            this.state.showPopup ? <PicturePopup 
                url={this.props.url} 
                tags={this.props.tags}
                id={this.props.id}
                date={this.props.date}
                closer={f}
                callback={f2}
                />
            : null
        ])
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
            this.footerRef.current.resetTags();
            for (let p of res) {
                local_pics.push(<Picture url={p.imgUrl} tags={p.tagList} date={p.creationDate} id={p._id}/>);
                this.footerRef.current.addTags(p.tagList);
            }

            comp.setState({pics: local_pics});
        }
    }

    constructor(props) {
        console.log("Content created with props : " + props);
        super(props);
        this.footerRef = React.createRef();
        this.state = {
            pics: null,
            tagCloud: <TagFooter ref={this.footerRef} addToQuery={this.props.tagCallback}/>
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
        return ([
            <div className="content-space">{this.state.pics}</div>,
            this.state.tagCloud]);
    }
}

class Query extends React.Component {

    constructor(props) {
        super(props);
        this.contentRef = React.createRef();
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.addToQuery = this.addToQuery.bind(this);
        this.state = {
            value: '',
            content:    <div className = "">
            <Content ref={this.contentRef} tags="" tagCallback={this.addToQuery}/>
            </div>
        }
    }

    addToQuery(tag) {
        let force = (this.state.value + tag + " ");
        this.setState({value: force});
        this.work(force);
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

    work(forced){

        let lastState = (forced === undefined ? this.state.value.trim() + " " : forced);
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
            tags: "tagme",
            uploading: false
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
            (function (err, resp, body) {this.setState({uploading: false}); console.log(err + "-" + resp + "-" + body); this.props.callback()}).bind(this));
    }

    handleSubmit(event) {
        event.preventDefault();
        this.setState({uploading: true});
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
        return ([
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
            </form><br />
            <i>{hint}</i>
            </div>,
            this.state.uploading ? <BigInfo text="Uploading..." /> : null]
        );
    }
}

class TagFooter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tagsList: [],
            tagsNum: []
        }

        this.addToQuery = this.props.addToQuery;

    }

    resetTags() {
        this.setState({
            tagsList: [],
            tagsNum: []});
    }

    addTags(array){
        let tagsNum = this.state.tagsNum;
        let tagList = this.state.tagsList;
        for (let t of array){
            if (tagList.includes(t)){
                tagsNum[t] += 1
            }else{
                tagsNum[t] = 1;
                tagList.push(t);
            }
        }

        this.setState({tagsNum: tagsNum, tagsList: tagList});
    }

    prepareTagCloud() {
        let res = [];
        let tuples = [];
        let total = 0;
        for (let t in this.state.tagsNum){    
            tuples.push([t, this.state.tagsNum[t]]);
            total += this.state.tagsNum[t];
        }

        let sortedTagList = tuples.sort(function (a, b) {
            if (a[1] < b[1]) 
                return 1;
            else if (a[1] > b[1]) 
                return -1;
            else 
                return 0;
        });

        for (let t of sortedTagList){
            let fs = {'fontSize': 11 + (50 * (t[1]/total))};
            let f = function(e) {e.preventDefault(); console.log(t[0]); this.addToQuery(t[0])};
            f = f.bind(this);
            res.push(<td style={fs} className="cloud-tag"><a href="#" onClick={f}>{t[0]}</a></td>);
        }

        return res;
    }

    render() {
        return (
            <div className="content-space cloud">
            {this.prepareTagCloud()}
            </div>
        );
    }
}

class PicturePopup extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            id: this.props.id,
            url: this.props.url,
            tags: this.props.tags.join(' '),
            date: this.props.date,
            tagging: false
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleTagsChange = this.handleTagsChange.bind(this);
    }

    handleTagsChange(event) {
        this.setState({tags: event.target.value});
    }


    sendRequest(obj) {
        console.log(obj);
        let formdata = {
            method: 'PUT',
            uri: 'https://overdio.herokuapp.com/images/' + obj.id,
            json: {
                _id: obj.id,
                imgUrl: obj.url,
                tagList: obj.tags.split(' '),
                creationDate: obj.date
            },
       };

        request(formdata,
            (function (err, resp, body) {this.setState({tagging: false}); this.props.callback();console.log(err + "-" + resp + "-" + body);}).bind(this));
    }

    handleSubmit(event) {
        event.preventDefault();
        this.setState({tagging: false});
        let tags = this.state.tags.trim();
        console.log(tags);
        this.sendRequest(
            {
                id: this.state.id,
                url: this.state.url,
                tags: tags,
                creationDate: this.state.date
            });
    }

    render() {
        let imgComp = null;
        let title = this.state.tags;
        if (this.state.url != null){
            imgComp = <img className="preview" src={this.state.url} alt={title} title={title}/>;
        }
        let hint = 'Hint: If you\'re lazy, set a "tagme" tag and wait for others to fill them for you.';
        let ml = {marginRight: '10px'};
        let a = {color: 'darkred'};
        return ([
            <div className="popup-bg">
                <div className="popup-fg">
                    {imgComp}
                    <form onSubmit={this.handleSubmit} id="upload-form">
                    <tr><td className="lab-field">
                    <label for="tagsarea">Tags (separated by whitespaces): </label>
                    </td><td>
                    <textarea
                        id="tagsarea"
                        value={title}
                        onChange={this.handleTagsChange}
                        name="tag-upload"
                        className="textarea"
                        form="upload-form"
                        rows="5"
                        cols="80"
                    ></textarea>
                    </td></tr>
                    <tr><td></td><td>
                    <input type="submit" onClick={this.handleSubmit} value="Update !" style={ml}/>
                    <a href="#" onClick={this.props.closer} style={a}>Cancel</a>
                    </td></tr>
                    </form><br />
                    <i>{hint}</i>
                </div>
            </div>,
            this.state.tagging ? <BigInfo text="Updating..." /> : null
        ]);
    }
}

class BigInfo extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let bgs = {textAlign: 'center'};
        let ps = {textAlign: 'center', fontSize:'12em', color: 'rgba(255, 255, 255, 0.75)'}
        return(
        <div style={bgs} className="popup-bg">
        <p style={ps}>{this.props.text}</p>
        </div>);
    }
}



const element = <Mode mode="search"/>;
ReactDOM.render(
    element,
    document.getElementById('root'));





// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
