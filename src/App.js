import React, { Component } from 'react';
import MediumEditor from 'medium-editor';
import Predictable from './predictable/predictable';
import { generateRandomId } from './predictable/utils';
import { words } from './words';

class App extends Component {
    editorContainer = React.createRef();

    constructor(props) {
        super( props );
        this.state = {
            predictableContainerId: `${ generateRandomId() }-${ generateRandomId() }`,
            editorId: `${ generateRandomId() }-${ generateRandomId() }`,
            mediumEditor: null,
            font: 'Arial, serif!important',
            fontSize: '16.63px!important',
            letterSpacing: '0!important'
        };
    }

    preventTabDefault = (e) => {
        const { key } = e;

        if ( key && key === 'Tab' ) {
            e.preventDefault();
        }
/*
        // TODO: Use control key + up/down to cycle through multiple suggestions.
        if ( e.ctrlKey && ( key === 'ArrowUp' || key === 'ArrowDown' ) ) {
            e.preventDefault();
        }

 */
    };

    componentDidMount() {
        new MediumEditor(
            this.editorContainer.current,
            {
                placeholder: {
                    text: 'Start writing...'
                },
                toolbar: true,
                autoLink: false,
                imageDragging: false,
                disableExtraSpaces: true
            }
        );

        const editor = document.getElementById( this.state.editorId );
        editor.addEventListener( 'keydown', this.preventTabDefault );
        editor.addEventListener( 'keyup', e => {
            const predictableContainer = document.getElementById( this.state.predictableContainerId );
            predictableContainer.style.display = 'none';

            if ( predictableContainer &&
                predictableContainer.firstChild &&
                predictableContainer.firstChild.firstChild.data !== '' &&
                e.key &&
                e.key !== 'Backspace' &&
                e.key !== 'Enter' &&
                // Only check for suggested phrases if the user is typing at the end of the document.
                this.isCaretAtEnd( editor )
            ) {
                const incompleteText = document.getSelection().anchorNode;

                if ( incompleteText ) {
                    const { top, left } = this.getLastWordCoordinates();
                    // We create the visual effect of a placeholder element by overlaying the
                    // suggestion container at the exact position of the incomplete text.
                    predictableContainer.style.top = `${ top }px`;
                    predictableContainer.style.left = `${ left }px`;
                    predictableContainer.style.display = 'inline';
                }
            }
        } );
        editor.style.cssText = `
            width: 826px;
            min-height: 970px;
            color: #333;
            background-color: #fff;
            margin-top: 100px;
            margin-left: auto;
            margin-right: auto;
            overflow: hidden;
            border-top: none;
            padding-top: 80px;
            padding-left: 96px!important;
            padding-right: 96px!important;
            border: 1px solid #80808082;
            position: relative;
            font-family: ${ this.state.font };
            font-size: ${ this.state.fontSize };
            letter-spacing: ${ this.state.letterSpacing };
            line-height: 1.7rem;
            outline: none;
        `;

        new Predictable( {
            predictableContainerId: this.state.predictableContainerId,
            editorId: this.state.editorId,
            data: { source: words },
            editor: editor,
            sensitivity: 3,
            predictableContainer: {
                container: (source) => {
                    source.setAttribute( 'id', this.state.predictableContainerId );
                    source.style.cssText = `
                        display: none;
                        font-family: ${ this.state.font };
                        font-size: ${ this.state.fontSize };
                        letter-spacing: ${ this.state.letterSpacing };
                        -webkit-user-modify: read-only;
                        user-select: none;
                        cursor: text;
                        position: fixed;
                        text-overflow: ellipsis;
                        white-space: wrap;
                        max-width: 320px;
                        overflow: hidden;
                        z-index: 99999;
                        color: #757575;
                        opacity: 0.7;
                        overflow: hidden;
                    `;
                }
            },
            suggestionText: {
                content: ({ match }, source) => {
                    source.textContent = match;
                }
            },
            context: {
                getData: () => {
                    this.getLastWordCoordinates();

                    return this.getLastWord();
                }
            },
            onTabPress: () => {
                const incompleteText = document.getSelection().anchorNode,
                    range = document.createRange();

                range.selectNodeContents( incompleteText );

                let _incompleteText = incompleteText;

                if ( incompleteText.nodeType === 3 ) {
                    _incompleteText = incompleteText.data;
                } else {
                    _incompleteText = incompleteText.textContent;
                }

                let autocompleteText = document.querySelector( '.predictable__suggestion' ).firstChild.data;
                autocompleteText = autocompleteText.replace( _incompleteText, '' );

                this.insertTextAtCursor( this.editorContainer.current, autocompleteText );
            }
        } );
    }

    componentWillUnmount() {
        document.removeEventListener( 'keydown', this.preventTabDefault );
    }

    /**
     * Renders an invisible `shadowNode` DOM element, positioned at the beginning of the last word.
     *
     * From here, `getBoundingClientRect` is called to obtain the top and left coordinates of the
     * word, and are used to overlay the suggested word container in exactly the same position.
     */
    getLastWordCoordinates = () => {
        const selection = window.getSelection(),
            anchorNode = selection.anchorNode,
            previousRange = selection.getRangeAt( 0 ),
            lastWordOffset = this.getLastWordOffset( this.getLastWord() ),
            range = document.createRange();

        range.setStart( anchorNode, lastWordOffset );
        range.setEnd( anchorNode, lastWordOffset );
        range.collapse( false );

        // Create a `shadowNode`, which is an invisible DOM node that allows the coordinates of the following
        // word to be calculated.
        const shadowNode = document.createElement( 'span' );
        shadowNode.id = generateRandomId();
        shadowNode.appendChild( document.createTextNode( '' ) );
        range.insertNode( shadowNode );
        selection.removeAllRanges();
        selection.addRange( previousRange );

        const { top, left } = shadowNode.getBoundingClientRect(),
            parentNode = shadowNode.parentElement;

        // Rejoins the text nodes which have been split by inserting the shadow node.
        parentNode.normalize();
        parentNode.removeChild( shadowNode );

        return { top, left };
    };

    getLastWord = () => {
        const selectedElement = window.getSelection().anchorNode;
        if ( selectedElement && selectedElement.data ) return selectedElement.data;
    };


    getLastWordOffset = (text) => {
        if ( text ) {
            const words = text.split( ' ' );
            const range = this.getLastWord();
            const lastWordOfRange = words[ words.length - 1 ].trim();

            // Returns the offset position of the last word.
            return range.length - lastWordOfRange.length;
        }

        return 0;
    };

    isCaretAtEnd = (element) => {
        let caretEndPosition = false,
            selectionRange,
            temporaryRange;

        if ( window.getSelection ) {
            const selection = window.getSelection();
            if ( selection && selection.rangeCount ) {
                selectionRange = selection.getRangeAt( 0 );
                temporaryRange = selectionRange.cloneRange();

                temporaryRange.selectNodeContents( element );
                temporaryRange.setEnd( selectionRange.startContainer, selectionRange.startOffset );
                temporaryRange.selectNodeContents( element );
                temporaryRange.setStart( selectionRange.endContainer, selectionRange.endOffset );
                caretEndPosition = ( temporaryRange.toString() === '' );
            }
        }

        return caretEndPosition;
    };

    insertTextAtCursor = (editor, text) => {
        let selection,
            range;

        if ( window.getSelection ) {
            selection = window.getSelection();
            if ( selection && selection.getRangeAt && selection.rangeCount ) {
                range = selection.getRangeAt( 0 );
                range.deleteContents();
                range.insertNode( document.createTextNode( text ) );
            }
        }
        // TODO: Fix issue with Firefox pushing caret to new paragraph
        this.placeCaretAtEnd( editor );
    };

    placeCaretAtEnd = (editor) => {
        if ( typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined' ) {
            const range = document.createRange();
            range.selectNodeContents( editor );
            range.collapse( false );

            const selection = window.getSelection();

            if ( selection ) {
                selection.removeAllRanges();
                selection.addRange( range );
            }
        }
    };

    render() {
        return (
            <div className="App">
                <div
                    id={ this.state.editorId }
                    ref={ this.editorContainer }
                />
            </div>
        );
    }
}

export default App;