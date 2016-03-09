export default class VisualDebugger {
    constructor (main) {
        this.main = main;
    }

    iluminate (variable) {
        this.clean();
        let cm = this.main.editor;
        let nLines = cm.getDoc().size;

        // Show line where the value of the variable is been asigned
        let varAssigned = [];
        let re = new RegExp('[\\s+](' + variable + ')[\\s|\\.|x|y|z|w|r|g|b|a|s|t|p|q]+[\\*|\\+|\-|\\/]?=', 'i');
        for (let i = 0; i < nLines; i++) {
            let match = re.exec(cm.getLine(i));
            if (match) {
                cm.setGutterMarker(i, 'var-in', makeMarker());
                varAssigned.push(i);
            }
        }

        // Highlight all calls to a variable
        this.overlay = searchOverlay(variable, true);
        cm.addOverlay(this.overlay);
        // if (cm.showMatchesOnScrollbar) {
        //   if (state.annotate) { state.annotate.clear(); state.annotate = null; }
        //   state.annotate = cm.showMatchesOnScrollbar(state.query, queryCaseInsensitive(state.query));
        // }
    }

    clean () {
        let cm = this.main.editor;
        cm.clearGutter('var-in');
        if (this.overlay) {
            cm.removeOverlay(this.overlay, true);
        }
        
    }
}

function makeMarker() {
    let marker = document.createElement('div');
    marker.setAttribute('class', 'ge_assing_marker');
    marker.innerHTML = '&#10095;';
    return marker;
}

function searchOverlay(query, caseInsensitive) {
    if (typeof query == "string")
      query = new RegExp(query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), caseInsensitive ? "gi" : "g");
    else if (!query.global)
      query = new RegExp(query.source, query.ignoreCase ? "gi" : "g");

    return {token: function(stream) {
      query.lastIndex = stream.pos;
      var match = query.exec(stream.string);
      if (match && match.index == stream.pos) {
        stream.pos += match[0].length || 1;
        return "searching";
      } else if (match) {
        stream.pos = match.index;
      } else {
        stream.skipToEnd();
      }
    }};
  }