import React, {Component} from 'react';
import OpenViduVideoComponent from './OvVideo';
import './UserVideo.css';

export interface UserVideoComponentProps {
    streamManager: any;
}

export default class UserVideoComponent extends Component {
    public props: UserVideoComponentProps;

    constructor(props: UserVideoComponentProps) {
        super(props);
        this.props = props;
    }

    getNicknameTag() {
        // Gets the nickName of the user
        return JSON.parse(this.props.streamManager.stream.connection.data).clientData;
    }

    render() {
        return (
            <div>
                {this.props.streamManager !== undefined ? (
                    <div className="streamcomponent">
                        <OpenViduVideoComponent streamManager={this.props.streamManager}/>
                        <div><p>{this.getNicknameTag()}</p></div>
                    </div>
                ) : null}
            </div>
        );
    }
}
