import { getCurrentGame } from './game_data_tab.js'

export class HexCanvas {
    #canvas = null; // HTML5 Canvas element
    focus = null; // Which hex will remain highlighted regardless of mouse
    cursor = null; // Which hex the mouse is currently over
    renderCursor = true;
    mouseDown = false;
    radius = 30;

    constructor(canvas) {
        this.#canvas = canvas;
        canvas.addEventListener('mousedown', (e) => {this.actionDown(e)});
        canvas.addEventListener('mouseup', (e) => {this.actionUp(e);});
        canvas.addEventListener('mousemove', (e) => {this.actionMove(e);});
        canvas.addEventListener('mouseleave', (e) => {this.actionLeave(e);});

        canvas.addEventListener('touchstart', (e) => {
            this.setCursorHex(e.targetTouches[0]);
            this.actionDown();
        });
        canvas.addEventListener('touchend', (e) => {
            this.actionUp();
        });
        canvas.addEventListener('touchcancel', (e) => {
            this.actionUp();
        });
        canvas.addEventListener('touchmove', (e) => {
            this.actionMove(e.targetTouches[0]);
        });
    }

    onClick() {
        // Callback to owner.
    }

    onMove() {
        // Callback to owner.
    }

    setFocusHexToCursor() {
        this.focus = this.cursor;
    }

    async render() {
        this.#canvas.width = this.#canvas.offsetWidth;
        this.#canvas.height = this.#canvas.offsetHeight;
        
        let ctx = this.#canvas.getContext('2d');
    
        ctx.fillStyle = '#BBBBBB';
        ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
    
        const game = await getCurrentGame()
        
        for (const hex of game.hexes.values()) {
            const details = game.details(hex)
            if (details == undefined) {
                console.error('Tried to draw undefined details:', hex, game.hexes, game.types)
            }
            this.fill_hex(ctx, hex.location, details.type.color)

            if (hex.labelID != null) {
                this.draw_hex_text(ctx, hex.location, details.label.shortLabel, invertColor(details.type.color));
            }
        }
    
        if (this.renderCursor)
            this.highlight_hex(ctx, this.cursor);
        this.draw_focus_hex(ctx, this.focus);
    }

    actionDown() {
        this.mouseDown = true;
        this.onClick();
        this.render();
    }

    actionUp() {
        this.mouseDown = false;
        this.render();
    }

    actionMove(e) {
        this.setCursorHex(e);
        this.onMove();
        this.render();
    }

    actionLeave(e) {
        this.mouseDown = false;
        this.cursor = null;
        this.onMove();
        this.render();
    }

    setCursorHex(mouseevent) {
        let rect = this.#canvas.getBoundingClientRect();
        let rel_x = mouseevent.clientX - rect.left;
        let rel_y = mouseevent.clientY - rect.top;

        let x = Math.round(rel_x / this.get_hex_x());
        let y = Math.round(rel_y / this.get_hex_y());
        if (x % 2 == 1) {
            y = Math.round((rel_y - (this.get_hex_x()/2))/ this.get_hex_y());
        }
        var cursor = [x, y]
        if (cursor !== this.cursor) {
            this.cursor = cursor
        }
    }

    get_hex_x() {
        return (1 + Math.sin(Math.PI/6)) * this.radius;
    }
    
    get_hex_y() {
        return 2 * this.radius * Math.cos(Math.PI/6);
    }

    get_hex_center(location) {
        const x = location[0]
        let y = location[1]

        if (x % 2 == 1) {
            y += 0.5;
        }
        let center_x = x * this.get_hex_x();
        let center_y = y * this.get_hex_y();
    
        return [center_x, center_y]
    }  

    highlight_hex(ctx, highlight) {
        if (highlight === null || highlight === undefined)
            return
        
        this.stroke_hex(ctx, highlight[0], highlight[1], '#FFFF00');
    }
    
    stroke_hex(ctx, location, color, lineWidth=2) {
        let old = ctx.lineWidth;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        this.trace_hex(ctx, location);
        ctx.stroke()
        ctx.lineWidth = old;
    }
    
    fill_hex(ctx, location, color) {
        const invColor = invertColor(color)
        this.stroke_hex(ctx, location, invColor);
        ctx.fillStyle = color;
        this.trace_hex(ctx, location);
        ctx.fill();
    }
    
    trace_hex(ctx, location) {
        let center =this.get_hex_center(location);
        let center_x = center[0];
        let center_y = center[1];
        
        ctx.beginPath();
        ctx.moveTo(center_x + this.radius, center_y)
    
        for(var i=1; i<=6; i++) {
            let angle = i * 2 * Math.PI / 6
            let nx = center_x + (Math.cos(angle) * this.radius)
            let ny = center_y + (Math.sin(angle) * this.radius)
            ctx.lineTo(nx, ny)
        }
    
        ctx.closePath();
    }
    
    draw_hex_text(ctx, location, text, color='#000000') {
        let center = this.get_hex_center(location);
        let metrics = ctx.measureText(text);
        let width = Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
        ctx.fillStyle = color;
        ctx.fillText(text, center[0] - (width/2), center[1] + (metrics.actualBoundingBoxAscent/2));
    }
    
    draw_focus_hex(ctx, location) {
        if (location === null)
            return;
            
        this.stroke_hex(ctx, location[0], location[1], '#007C88', 7);
    }
}

function invertColor(hex) {
    // https://stackoverflow.com/a/35970186
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    
    // https://stackoverflow.com/a/3943023/112731
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
        ? '#000000'
        : '#FFFFFF';
}