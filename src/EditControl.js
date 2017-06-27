import { PropTypes } from 'prop-types';
import Draw from 'leaflet-draw'; // eslint-disable-line
import isEqual from 'lodash.isequal';

import { LayersControl } from 'react-leaflet';
import { Map } from 'leaflet';

const eventHandlers = {
  onEdited: 'draw:edited',
  onEditStart: 'draw:editstart',
  onEditStop: 'draw:editstop',
  onDeleted: 'draw:deleted',
  onDeleteStart: 'draw:deletestart',
  onDeleteStop: 'draw:deletestop',
};

export default class EditControl extends LayersControl {
  static propTypes = {
    ...Object.keys(eventHandlers).reduce((acc, val) => {
      acc[val] = PropTypes.func;
      return acc;
    }, {}),
    onCreated: PropTypes.func,
    onMounted: PropTypes.func,
    otherEvents: PropTypes.arrayOf(PropTypes.shape({
      func: PropTypes.func,
      name: PropTypes.string
    })),
    draw: PropTypes.shape({
      polyline: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      polygon: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      rectangle: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      circle: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      marker: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    }),
    edit: PropTypes.shape({
      edit: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      remove: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      poly: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      allowIntersection: PropTypes.bool,
    }),
    position: PropTypes.oneOf([
      'topright',
      'topleft',
      'bottomright',
      'bottomleft'
    ])
  };

  static contextTypes = {
    map: PropTypes.instanceOf(Map),
    layerContainer: PropTypes.shape({
      addLayer: PropTypes.func.isRequired,
      removeLayer: PropTypes.func.isRequired
    })
  };

  onDrawCreate = (e) => {
    const { onCreated } = this.props;
    const { layerContainer } = this.context;

    layerContainer.addLayer(e.layer);
    onCreated && onCreated(e);
  };


  _updateEvents = type => {
    const changeEvent = this.context.map[type].bind(this.context.map);

    changeEvent('draw:created', this.onDrawCreate);

    for(const key in eventHandlers) {
      if (this.props[key]) {
        changeEvent(eventHandlers[key], this.props[key]);
      }
    }

    let otherEvents = this.props.otherEvents;
    if (otherEvents) {
      otherEvents.forEach(({ name, func }) => changeEvent(name, func));
    }
  };

  componentWillMount() {
    this.updateDrawControls();
  }

  componentDidMount() {
    const { onMounted } = this.props;
    super.componentDidMount();
    onMounted && onMounted(this.leafletElement);
  }

  componentWillUnmount() {
    this.leafletElement.remove(this.context.map);
    this._updateEvents('off');
  }

  componentDidUpdate(prevProps) {
    // super updates positions if thats all that changed so call this first
    super.componentDidUpdate(prevProps);

    if (isEqual(this.props.draw, prevProps.draw) || this.props.position !== prevProps.position) {
      return false;
    }

    this.reset();
    return null;
  }

  reset = () => {
    const { map } = this.context;
    this.leafletElement.remove(map);
    this.updateDrawControls();
    this.leafletElement.addTo(map);
  };

  updateDrawControls = () => {
    const { layerContainer } = this.context;
    const { draw, edit, position } = this.props;
    const options = {
      edit: {
        ...edit,
        featureGroup: layerContainer
      }
    };

    if (draw) {
      options.draw = draw;
    }

    if (position) {
      options.position = position;
    }

    this.leafletElement = new L.Control.Draw(options); // eslint-disable-line

    this._updateEvents('off');
    this._updateEvents('on');
  };
}
