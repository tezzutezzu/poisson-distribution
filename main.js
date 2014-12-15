var ratio = window.devicePixelRatio || 1;
var settings = {
    radius: 3,
    radiusDistance: 4,
    tries: 100
};


var width;
var height;
var img;
var timeOutId;

/* dom elements */
var intro = document.querySelector('#intro');
var svg = document.querySelector('#svg');
var imgCanvas = document.createElement('canvas');
var ctx = imgCanvas.getContext('2d');
var demobtn = document.querySelector('#demobtn');
var defaultUploadBtn = document.querySelector('#upload');
var firstTime = true;
var isSaving = false;

var gui = new dat.GUI();


demobtn.addEventListener('click', function(e) {
    init();
});


/* drop area */
var dropzone = document.querySelector('body');

dropzone.addEventListener('dragover', function() {
    dropzone.addClass('hover');
    return false;
});

dropzone.addEventListener('dragleave', function() {
    dropzone.removeClass('hover');
    return false;
});

dropzone.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    dropzone.removeClass('hover');

    var files = e.originalEvent.dataTransfer.files;
    processFiles(files);

    return false;
});


function processFiles(files) {
    if (files && typeof FileReader !== "undefined") {
        for (var i = 0; i < files.length; i++) {

            readFile(files[i]);
        }
    } else {
        alert("error uploading files...");
    }
}



function readFile(file) {
    if ((/image/i).test(file.type)) {
        //define FileReader object
        var reader = new FileReader();

        //init reader onload event handlers
        reader.onload = function(e) {
            var image = $('<img/>')
                .load(function() {
                    img = this;
                    init();
                })
                .attr('src', e.target.result);
        };

        //begin reader read operation
        reader.readAsDataURL(file);
    } else {
        //some message for wrong file format
    }
}



function init() {

    if (!img) {
        img = new Image();
        img.onload = function() {
            start();
        }
        img.src = "eye.png";
    } else {
        start();
    }

}

function start(mouseX, mouseY) {

    isSaving = false;
    intro.style.display = 'none';

    if (imgCanvas.width) ctx.clearRect(0, 0, imgCanvas.width, imgCanvas.height);

    if (img.width > img.height) {
        width = imgCanvas.width = 800;
        height = imgCanvas.height = (800 / img.width) * img.height;
    } else {
        height = imgCanvas.height = 800;
        width = imgCanvas.width = img.width * 800 / img.height;
    }

    ctx.drawImage(img, 0, 0, width, height);

    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
    svg.style.display = 'block';
    svg.style.width = img.width + "px";
    svg.style.height = img.height + "px";


    var x = mouseX || width / 2;
    var y = mouseY || height / 2;


    var r = settings.radiusDistance * ratio;
    var x0 = r;
    var y0 = r;
    var x1 = width - r;
    var y1 = height - r;

    var active = -1;
    var k = settings.tries;
    var id = ++active;
    var inner2 = r * r;
    var A = 4 * r * r - inner2;
    var cellSize = r * Math.SQRT1_2;
    var gridWidth = Math.ceil(width / cellSize);
    var gridHeight = Math.ceil(height / cellSize);
    var grid = new Array(gridWidth * gridHeight);
    var queue = [];
    var n = 0;
    var count = -1;

    clearTimeout(timeOutId);
    emitSample([x, y]);
    go();

    function go() {
        var start = Date.now();
        while (n && Date.now() - start < 17) {
            var i = Math.random() * n | 0,
                p = queue[i];

            for (var j = 0; j < k; ++j) {
                var q = generateAround(p);
                if (withinExtent(q) && !near(q)) {
                    emitSample(q);
                    break;
                }
            }
            if (j === k) queue[i] = queue[--n], queue.pop();
        };
        (n > 0) ? timeOutId = setTimeout(go, 10) : done();
    }

    function done() {
        if (firstTime) {
            gui.add(settings, 'radius', 1, 5);
            gui.add(settings, 'radiusDistance', 1, 10);
            gui.add(window, 'start');
            gui.add(window, 'savesvg');
            svg.addEventListener('click', function(e) {
                var parentOffset = svg.parentNode.getBoundingClientRect;
                var x = e.pageX - parentOffset.left;
                var y = e.pageY - parentOffset.top;
                start(x, y);
            });
        }
        firstTime = false;
    }



    function emitSample(p) {
        queue.push(p), ++n;
        grid[gridWidth * (p[1] / cellSize | 0) + (p[0] / cellSize | 0)] = p;
        var pixelData = imgCanvas.getContext('2d').getImageData(p[0], p[1], 1, 1).data;
        /* http://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color */
        var luminance = (0.299 * pixelData[0] + 0.587 * pixelData[1] + 0.114 * pixelData[2]);
        var newRadius = luminance / 255;
        newRadius *= settings.radius;

        var circle = makeSVG('circle', {
            cx: p[0],
            cy: p[1],
            r: newRadius,
            fill: 'white'
        });
        svg.appendChild(circle);
    }

    function makeSVG(tag, attrs) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in attrs)
            el.setAttribute(k, attrs[k]);
        return el;
    }

    function generateAround(p) {
        // random point in annulus 
        var θ = Math.random() * 2 * Math.PI;
        var r = Math.sqrt(Math.random() * A + inner2); // http://stackoverflow.com/a/9048443/64009
        return [p[0] + r * Math.cos(θ), p[1] + r * Math.sin(θ)];
    }

    function near(p) {
        var n = 2,
            x = p[0] / cellSize | 0,
            y = p[1] / cellSize | 0,
            x0 = Math.max(x - n, 0),
            y0 = Math.max(y - n, 0),
            x1 = Math.min(x + n + 1, gridWidth),
            y1 = Math.min(y + n + 1, gridHeight);
        for (var y = y0; y < y1; ++y) {
            var o = y * gridWidth;
            for (var x = x0; x < x1; ++x) {
                var g = grid[o + x];
                if (g && distance2(g, p) < inner2) return true;
            }
        }
        return false;
    }

    function withinExtent(p) {
        var x = p[0],
            y = p[1];
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }

    function distance2(a, b) {
        var dx = b[0] - a[0],
            dy = b[1] - a[1];
        return dx * dx + dy * dy;
    }

}


function savesvg() {
    isSaving = true;
    svg.attr({
        version: '1.1',
        xmlns: "http://www.w3.org/2000/svg"
    });
    var $div = $("<div/>");
    $div.append(svg);
    var t = $div.html();
    var b64 = window.btoa(unescape(encodeURIComponent(t)));
    $(".container").append($("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n" + b64 + "' title='file.svg'>Download</a>"));

}