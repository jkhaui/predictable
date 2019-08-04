<h1>Predictable</h1>

_Predictable_ is a basic PoC web app to demonstrate how predictive text/autocomplete/lookahead/typeahead
can be applied to a contenteditable element. This functionality is seen in real-world apps, with the 
seminal example being Gmail's "Smart Compose feature". Pressing the Tab key will autocomplete a suggested
phrase.
<br />
<h3>Quick Start</h3>
`> git clone https://github.com/jkhaui/predictable`
<br />
`> npm install`
<br />
`> npm start`

<br />
This project is bootstrapped with create-react-app. It also uses Medium-Editor as a solid
base for contenteditable. However, neither React nor Medium-Editor are tightly coupled to
Predictable's functionality, which is written in vanilla JS and can easily be modified to work with 
any contenteditable container.
<br />
<br />
N.b. Being a simple PoC, there are some obvious bugs. E.g. The first word of the text editor
in Chrome is, for some strange reason, positioned differently to the rest of the text. This causes the
autocomplete placeholder to appear misaligned if applied at the very beginning of a document.

<br />
<br />
This example uses a large corpus of phrases related to the legal domain, but they can be easily swapped
out for another data source. Improvements and PRs are highly welcomed.