import { predictableMethods } from './predictableMethods';
import { Polyfill } from './polyfill';

export default class Predictable {
    constructor(options) {
        this.editorId = options.editorId;
        this.predictableContainerId = options.predictableContainerId;
        this.editor = options.editor;
        this.active = false;
        this.data = {
            // Data for suggested phrases can be obtained in numerous ways. E.g. a single static source can be used,
            // or a function can be passed to hydrate initial suggestions from a list before switching to a dynamic
            // data source.
            source: () => ( typeof options.data.source === 'function' ? options.data.source() : options.data.source ),
            cache: false
        };
        this.context = options.context;
        this.sensitivity = options.sensitivity || 3;
        this.predictableContainer = {
            view: predictableMethods.createResultsList( {
                container: options.predictableContainer && options.predictableContainer.container
                    ? options.predictableContainer.container
                    : false,
                destination: options.editor,
                position: 'afterend',
                element: 'div',
            } ),
        };
        this.suggestionText = {
            content: options.suggestionText && options.suggestionText.content ? options.suggestionText.content : false,
            element: 'span'
        };
        this.onTabPress = options.onTabPress;
        this.suggestionsData = options.suggestionsData;
        this._initPredictable();
    }

    _initPredictable() {
        this.suggestionsData = this.data.source();
        this.renderSuggestions();

        Polyfill.initElementClosestPolyfill();
    }

    lookupSuggestions = (currentText, suggestion) => {
        // Use `startsWith` method to ensure that only predictions exactly matching the currently typed word
        // are rendered. Otherwise, the prediction container's visual alignment will be thrown off.
        if ( suggestion.startsWith( currentText ) ) {
            return suggestion;
        }
    };

    getMatchingSuggestion(data) {
        return new Promise( resolve => {
            const allSuggestions = [];
            data.filter( (suggestion, index) => {
                const match = this.lookupSuggestions( this.queryValue, suggestion );
                if ( match ) {
                    allSuggestions.push( {
                        index,
                        match, value: suggestion
                    } );
                }

                return allSuggestions;
            } );

            const firstSuggestion = allSuggestions.slice( 0, 1 );

            predictableMethods.insertSuggestion( this.predictableContainer.view, allSuggestions, this.suggestionText );

            return resolve( {
                matches: allSuggestions.length,
                list: firstSuggestion
            } );
        } );
    }

    renderSuggestions = () => {
        const getAllSuggestions = (e) => {
            const text = this.editor.textContent;
            const currentText = ( this.queryValue =
                this.context && this.context.getData ? this.context.getData( text ) : text );
            const triggerCondition = ( currentText
                ? currentText.length > this.sensitivity && currentText.replace( / /g, '' ).length
                : '' );
            const predictableEventHandler = (e, results) => {
                this.editor.dispatchEvent(
                    new Polyfill.CustomEventWrapper( 'Predictable', {
                        bubbles: true,
                        detail: {
                            event: e,
                            input: text,
                            context: currentText,
                            matches: results ? results.matches : null,
                            results: results ? results.list : null,
                        },
                        cancelable: true,
                    } ),
                );
            };

            const selected = this.onTabPress;
            const resultsList = this.predictableContainer.view;
            const clearResults = predictableMethods.clearResults( resultsList );

            if ( triggerCondition ) {
                this.getMatchingSuggestion( this.suggestionsData )
                    .then( suggestions => {
                        predictableEventHandler( e, suggestions );

                        if ( selected ) {
                            predictableMethods.getSelection(
                                this.predictableContainerId,
                                this.editor,
                                resultsList,
                                selected,
                                suggestions );
                        }
                    } );
            } else {
                predictableEventHandler( e );
                predictableMethods.clearResults( this.predictableContainer.view );
            }

        };

        this.editor.addEventListener(
            'keyup', (e) => {
                this.suggestionsData = this.data.source();
                getAllSuggestions( e )
            }
        );
    }
}
