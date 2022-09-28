import React, {Component, RefObject} from 'react';

export interface OvVideoProps {
    streamManager: any;
}

export default class OpenViduVideoComponent extends Component {
    public videoRef: RefObject<any>;
    public props: OvVideoProps;

    constructor(props: OvVideoProps) {
        super(props);
        this.props = props;
        this.videoRef = React.createRef();
    }

    componentDidUpdate(props: OvVideoProps) {
        if (props && !!this.videoRef) {
            this.props.streamManager.addVideoElement(this.videoRef.current);
        }
    }

    componentDidMount() {
        if (this.props && !!this.videoRef) {
            this.props.streamManager.addVideoElement(this.videoRef.current);
        }
    }

    render() {
        return <video autoPlay={true} ref={this.videoRef}/>;
    }
}