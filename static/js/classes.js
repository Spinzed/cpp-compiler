class Row {
    constructor(editor, id) {
        this.editor = editor;
        this.id = id;
        this.words = 0;
        this.content = "";
        this.node = document.createElement("div");
        this.node.id = "row" + this.id;
        this.node.classList.add("rows");
        this.editor.rowNode.appendChild(this.node);
    }

    update(forceRemaining = false) { // Parses input field and puts its content into spans
        let value = "";
        if (this.id == this.editor.currentRow || forceRemaining == true) {
            value = this.editor.rows[this.id - 1].content + this.editor.remaining;
        } else {
            value = this.editor.rows[this.id - 1].content;
        }
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
        this.editor.rows[this.id - 1].words = 0;
        this.editor.column = 1;
        let elements = Parsing.parseToArray(value);
        for (var i = 0; i < elements.length; i++) { // creates spans for every word. Its possible to force word type
            if (elements.length > 2 && elements[0] == "#include" && "<\"".includes(elements[2][0]) && i != 0) {
                this.editor.rows[this.id - 1].makeSpan(elements[i], "string");
            }
            else {
                this.editor.rows[this.id - 1].makeSpan(elements[i]); // default
            }
        }
        if (this.id == this.editor.currentRow) {
            this.editor.rows[this.id - 1].content = this.editor.currentRowValue;
        }
        else {
            this.editor.rows[this.id - 1].content = value;
        }
    }

    makeSpan(content, forcedType = "") {
        let parsedContent = Parsing.parseToHTML(content);
        let span = document.createElement("span");

        span.innerHTML = parsedContent;
        span.classList.add("textspan");
        forcedType == "" ? span.classList.add(Parsing.getType(content)) : span.classList.add(forcedType);
        span.id = this.id + "_" + (this.words + 1);

        let rowdiv = document.getElementById("row" + this.id);
        rowdiv.appendChild(span);
        this.words++;
    }

    splitContent(index, includeRemaining = true) { // takes entire content from a row and splits it on the wanted index
        let content = "";
        includeRemaining ? content = this.content + this.editor.remaining : content = this.content;
        let decoy1 = "";
        let decoy2 = "";
        for (var i = 0; i < content.length; i++) {
            i < index ? decoy1 += content[i] : decoy2 += content[i];
        }
        this.content = decoy1;
        this.editor.remaining = decoy2;
    }

    focus(letter) {
        this.editor.currentRowValue += this.editor.remaining;
        this.editor.remaining = "";
        this.editor.currentRow = this.id;
        let value = this.editor.currentRowValue;
        let decoy = "";
        for (let i = 0; i < value.length; i++) { i < letter ? decoy += value[i] : this.editor.remaining += value[i]; }
        this.editor.currentRowValue = decoy;
        this.editor.postInit();
    }

    countValues(value) { // counts appearences of one
        let content = this.content;
        return content.split(value).length - 1;
    }

    countTabs() {
        let content = this.content;
        let count = 0;
        while (content.substring(0, 4) == "    ") {
            content = content.substring(4, content.length);
            count++;
        }
        return count;
    }

    updateNode(newId) {
        this.id = newId;
        this.node.id = "row" + newId;
    }
}

class Word {
    constructor(content, row, id) {
        this.row = row;
        this.id = id;
        this.value = content;
    }
    get type() {
        return Parsing.getType(this.value);
    }
    get hash() {
        return row + "_" + id;
    }
}

class LCounter {
    constructor(editor) {
        this.editor = editor;
        this.node = document.getElementById(this.editor.id + "_rowline");
        this.rows = 0;
    }

    update() {
        let numOfRows = this.editor.rows.length;
        while(this.rows > numOfRows) {
            this.node.removeChild(this.node.lastChild);
            this.rows--;
        }
        while(this.rows < numOfRows) {
            let newr = document.createElement("div");
            newr.classList.add("rows");
            newr.classList.add("counter");
            newr.innerHTML = this.rows + 1;
            this.node.appendChild(newr);
            this.rows++;
        }
    }
}

class Caret {
    constructor(editor) {
        this.editor = editor;
        this.node = document.getElementById(this.editor.id + "_caret");
        this.input = document.getElementById(this.editor.id + "_input");
        this.caret = document.createElement("div");
        this.caret.className += "caret";
        $(window).on('mousedown', this.updateStatus.bind(this)); // this is used to kill the caret
    }
    _blink() { // this should be a private method but JS is fucked so..
        !this.node.contains(this.caret) ? this.node.insertBefore(this.caret, this.input) : null;
        this.blinkTimeout = setTimeout(() => {
            try {
                this.node.removeChild(this.caret);
            }
            catch (DOMException) { }
        }, 500);
    }
    blink() { // it will start blinking and it will refresh it if it is already blinking
        this.kill();
        this._blink();
        this.blinkInterval = setInterval(this._blink.bind(this), 1000);
    }
    kill() { // makes the caret stop blinking
        clearInterval(this.blinkInterval);
        clearTimeout(this.blinkTimeout);
        this.node.contains(this.caret) ? this.node.removeChild(this.caret) : null;
    }
    updateStatus(event) {
        let pass = [this.editor.rowNode, this.editor.core, this.editor.counter.node];
        !pass.includes(event.target) ? this.kill() : null;
        // ^^ removes the carret if you click somewhere that isnt in the filter
    }
    updatePosition() {
        this.node.style.left = (10 + (8.8 * this.editor.currentRowValue.length)) + "px";
        this.node.style.top = ((this.editor.currentRow - 1) * 20) + "px";
    }
}
class Submit {
    constructor(editor) {
        this.editor = editor;
        this.btn = document.getElementById("submit_code");
        this.isProcessing = false;
        this.btn.addEventListener("mousedown", () => {
            if (!this.isProcessing) {
                if (window.debug) {
                    console.log("sending...")
                    let start = new Date();
                }
                axios.post("/", {
                    kod: this.editor.packData()
                })
                .then(response => {
                    output.node.style.display = "block";
                    output.codeNode.innerHTML = "";
                    let arr = response.data.split("\n");

                    if (arr[0] == "success") {
                        output.codeNode.style.color = "white";
                    } else if (arr[0] == "error") {
                        output.codeNode.style.color = "red";
                    } else {
                        console.error("unknown outcome")
                    }
                    arr.shift()
                    for (let i = 0; i < arr.length; i++) {
                        i != 0 ? output.codeNode.innerHTML += "<br/>" : null;
                        output.codeNode.innerHTML += arr[i];
                    }
                    if (window.debug) {
                        let end = new Date() - start;
                        console.log("execution time: " + end + "ms")
                    }
                    this.isProcessing = false;
                })
                .catch(err => {
                    console.error(err);
                    this.isProcessing = false;
                })
            } else {
                console.log("already processing, try again later");
            }
        })
    }
}

class Output {
    constructor(editor) {
        this.editor = editor;
        this.node = document.getElementById("output");
        this.codeNode = document.getElementById("output_text")
    }
}
