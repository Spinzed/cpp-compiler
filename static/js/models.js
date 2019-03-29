class editor {
    constructor(id) {
        this.rows = [];
        this.node = document.getElementById(id);
        this.input = document.getElementById("input");
        this.rowNode = document.getElementById("rows");
        this.input.addEventListener("keydown", checkForDown);
        this.currentRow = 0; // id of the active row
        this.currentWord = 0; // id of the active word in a row
        this.remaining = "";
        this.makeNewRow();
    }

    makeNewRow() {
        this.shiftRowsDown(); // this will take care of everything if the row isnt the last one

        if (this.rows.length == this.currentRow) { // it will do this is this is the last row
            let newRow = new row(this.currentRow + 1, this);
            this.rows.push(newRow);
        }

        this.currentRow++;
        if (this.currentRow != 1) { 
            this.currentRowNode.update(false); // this is needed because remaining value is transfered to another line, will skip if its the first line
        }
    }

    deleteLine(targetedRow = this.currentRow) {
        let targetedRowDiv = document.getElementById("row" + targetedRow);
        rows.removeChild(targetedRowDiv);

        this.rows.splice(targetedRow - 1, 1)

        this.currentRow--;
        this.currentWord = this.currentRowNode.words;
        this.shiftRowsUp();
    }

    shiftRowsUp() {
        for (var i = this.currentRow; i < this.rows.length; i++) {
            this.rows[i].updateNode(i + 1);
            this.rows[i].update();
        }
        this.currentRowNode.update();
    }

    shiftRowsDown() {
        for (var i = this.rows.length; i > this.currentRow; i--) { // will not go through if currentrow = rows.length
            if (i == this.rows.length) {
                let newRow = new row(this.rows.length + 1, this);
                this.rows.push(newRow);
                ed.rows[i].content = ed.rows[i - 1].content;
                ed.rows[i].update(false);
            }
            if (i > this.currentRow + 1) {  // skips at first row creation
                ed.rows[i - 1].content = ed.rows[i - 2].content;
            }
            if (i == this.currentRow + 1) {
                ed.rows[i - 1].content = "";
            }
            ed.rows[i - 1].update(false);
        }
    }

    focusInput() {
        this.input.focus();
    }

    refreshInput() {
        ed.node.removeChild(this.input);
        ed.node.appendChild(this.input);
        this.input.focus();
    }
    
    get currentRowValue() {
        return this.rows[this.currentRow - 1].content;
    }

    set currentRowValue(value) {
        this.rows[this.currentRow - 1].content = value;
        return this.rows[this.currentRow - 1].content;
    }

    get currentRowNode() {
        return this.rows[this.currentRow - 1];
    }

    set currentRowNode(value) {
        this.rows[this.currentRow - 1] = value;
        return this.rows[this.currentRow - 1];
    }

    get getRowCount() {
        return this.rows.length;
    }
}

class row {
    constructor(id, editor) {
        this.id = id;
        this.words = 0;
        this.content = "";
        this.node = document.createElement("div");
        this.node.id = "row" + this.id;
        this.node.classList.add("rows");
        this.editor = editor;
        this.editor.rowNode.appendChild(this.node);
        this.node.setAttribute("onclick", "focusRow.call(this)")
    }

    update(space, forceRemaining = false) { // Parses input field and puts its content into spans
        let value = "";
        if (this.id == this.editor.currentRow || forceRemaining == true) {
            value = this.editor.rows[this.id - 1].content + this.editor.remaining;
        }
        else {
            value = this.editor.rows[this.id - 1].content;
        }
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
        this.editor.rows[this.id - 1].words = 0;
        this.editor.column = 1;
        this.editor.currentWord = 1;
        let elements = parseToArray(value);
        for (var i = 0; i < elements.length; i++) {
            if (i == elements.length - 1) {
                this.editor.rows[this.id - 1].makeSpan(elements[i], space);
            }
            else {
                this.editor.rows[this.id - 1].makeSpan(elements[i], false);
            }
        }
        if (this.id == this.editor.currentRow) {
            this.editor.rows[this.id - 1].content = this.editor.currentRowValue;
        }
        else {
            this.editor.rows[this.id - 1].content = value;
        }
    }

    makeSpan(content, space) {
        // console.log(content)
        let parsedContent = parseToHTML(content);
        let span = document.createElement("span");
        if (space) {
            span.innerHTML = parsedContent + "&nbsp;";
        }
        else {
            span.innerHTML = parsedContent;
        }
        span.classList.add("textspan");
        span.classList.add(getType(content));
        span.id = this.id + "_" + (this.words + 1);
        // for (var i = this.words; i > parseToArray(this.content).length; i--) {
        //     let elem1 = document.getElementById(this.id + "_" + i);
        //     elem1.id = this.id + "_" + (i + 1);
        // }

        let rowdiv = document.getElementById("row" + this.id);
        rowdiv.appendChild(span);
        this.words++;
    }

    countTabs() {
        let content = this.content;
        let count = 0;
        while(content.substring(0,4)=="    ") {
            content = content.substring(4,content.length);
            count++;
        }
        return count;
    }

    updateNode(newId) {
        this.id = newId;
        this.node.id = "row" + newId;
    }
}

class word {
    constructor(content, row, id) {
        this.row = row;
        this.id = id;
        this.value = content;
    }
    get type() {
        return getType(this.value);
    }
    get hash() {
        return row + "_" + id;
    }
}