import { generateRandomId } from './utils';

const dataAttribute = 'data-result';
const select = {
    predictableContainer: `${ generateRandomId() }-${ generateRandomId() }`,
    result: `${ generateRandomId() }-${ generateRandomId() }`
};

const getInput = (selector) => selector;

const createResultsList = (renderResults) => {
    const { container, position, element, destination } = renderResults;
    const resultsList = document.createElement( element );
    resultsList.setAttribute( 'id', select.predictableContainer );

    if ( container ) {
        container( resultsList );
    }

    destination.insertAdjacentElement( position, resultsList );
    return resultsList;
};

const insertSuggestion = (resultsList, dataSrc, resultItem) => {
    if ( dataSrc.length > 0 ) {
        const result = document.createElement( resultItem.element );
        const resultValue = dataSrc[ 0 ].value;
        result.setAttribute( dataAttribute, resultValue );
        result.setAttribute( 'id', select.result );
        result.setAttribute( 'class', 'predictable__suggestion' );
        result.setAttribute( 'style', 'white-space: nowrap' );
        resultItem.content ? resultItem.content( dataSrc[ 0 ], result )
            : ( result.innerHTML = dataSrc[ 0 ].match || dataSrc[ 0 ] );
        resultsList.appendChild( result );
    }
};

const clearResults = resultsList => ( resultsList.innerHTML = '' );

const getSelection = (predictableContainerId, editor, resultsList, callback, resultsValues) => {
    const results = document.getElementById( select.result );
    const predictableContainer = document.getElementById( predictableContainerId );

    if ( results ) {
        document.addEventListener( 'keydown', tabListener );
    }

    function tabListener(e) {
        if ( e.key === 'Tab' &&
            predictableContainer.firstChild &&
            predictableContainer.firstChild.firstChild.data !== ''
        ) {
            // Callback function invoked on user selection
            callback( {
                event: e,
                context: editor.innerHTML,
                matches: resultsValues.matches,
                results: resultsValues.list.map( record => record.value ),
                selection: resultsValues.list.find( value => {
                    const resValue = value.value;
                    return resValue === results.getAttribute( dataAttribute );
                } ),
            } );

            // Clear Results after selection is made
            clearResults( resultsList );
            document.removeEventListener( 'keyup', tabListener );
        }
    }
};

export const predictableMethods = {
    getInput,
    createResultsList,
    insertSuggestion,
    clearResults,
    getSelection,
};

