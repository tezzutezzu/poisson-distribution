$(function() {


    var dropzone = $('#droparea');

    dropzone.on('dragover', function() {
        dropzone.addClass('hover');
        return false;
    });

    dropzone.on('dragleave', function() {
        dropzone.removeClass('hover');
        return false;
    });

    dropzone.on('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();
        dropzone.removeClass('hover');

        var files = e.originalEvent.dataTransfer.files;
        processFiles(files);

        return false;
    });



    var imgCanvas;
    var img = new Image();
    var svg;
    img.onload = init;
    img.src = "eye.png";

    function init() {
        imgCanvas = $('<canvas />')[0];
        imgCanvas.width = img.width;
        imgCanvas.height = img.height;
        imgCanvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        svg = document.getElementById('s');

        var ratio = window.devicePixelRatio || 1,
            radius = 2.5 * ratio,
            width = 800,
            height = 800,
            x0 = radius,
            y0 = radius,
            x1 = width - radius,
            y1 = height - radius,
            active = -1,
            k = 100;

        reset(2 * radius, width / 2, height / 2);


        function reset(r, x, y) {
            var id = ++active,
                inner2 = r * r,
                A = 4 * r * r - inner2,
                cellSize = r * Math.SQRT1_2,
                gridWidth = Math.ceil(width / cellSize),
                gridHeight = Math.ceil(height / cellSize),
                grid = new Array(gridWidth * gridHeight),
                queue = [],
                n = 0,
                count = -1;

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

                if (n > 0) requestAnimationFrame(go);
            }

            function emitSample(p) {
                queue.push(p), ++n;
                grid[gridWidth * (p[1] / cellSize | 0) + (p[0] / cellSize | 0)] = p;

                var pixelData = imgCanvas.getContext('2d').getImageData(p[0], p[1], 1, 1).data;

                var luminance = (0.299 * pixelData[0] + 0.587 * pixelData[1] + 0.114 * pixelData[2]);
                var newRadius = luminance / 10;

                var circle = makeSVG('circle', {
                    cx: p[0],
                    cy: p[1],
                    r: 0,
                    fill: 'white'
                });
                svg.appendChild(circle);

                requestAnimationFrame(scale);

                function scale() {
                    var r = circle.getAttribute("r");
                    circle.setAttribute("r", parseFloat(r) + 0.1);
                    if (r < newRadius) requestAnimationFrame(scale);
                }


            }

            function makeSVG(tag, attrs) {
                var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                for (var k in attrs)
                    el.setAttribute(k, attrs[k]);
                return el;
            }




            function generateAround(p) {
                var θ = Math.random() * 2 * Math.PI,
                    r = Math.sqrt(Math.random() * A + inner2); // http://stackoverflow.com/a/9048443/64009
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


});