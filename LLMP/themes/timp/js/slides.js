function main() {
    // Since we don't have the fallback of attachEvent and
    // other IE only stuff we won't try to run JS for IE.
    // It will run though when using Google Chrome Frame
    if (document.all) {
        return;
    }

    var currentSlideNo;
    var notesOn = false;
    var hiddenNext = false;
    var blanked = false;
    var slides = document.getElementsByClassName('slide');
    var touchStartX = 0;
    var spaces = /\s+/, a1 = [''];
    var tocOpened = false;
    var helpOpened = false;
    var overviewActive = false;
    var modifierKeyDown = false;
    var scale = 1;
    var showingPresenterView = false;
    var presenterViewWin = null;
    var isPresenterView = false;

    var str2array = function (s) {
        if (typeof s == 'string' || s instanceof String) {
            if (s.indexOf(' ') < 0) {
                a1[0] = s;
                return a1;
            } else {
                return s.split(spaces);
            }
        }
        return s;
    };

    var trim = function (str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };

    var addClass = function (node, classStr) {
        classStr = str2array(classStr);
        var cls = ' ' + node.className + ' ';
        for (var i = 0, len = classStr.length, c; i < len; ++i) {
            c = classStr[i];
            if (c && cls.indexOf(' ' + c + ' ') < 0) {
                cls += c + ' ';
            }
        }
        node.className = trim(cls);
    };

    var removeClass = function (node, classStr) {
        var cls;
        if (!node) {
            throw 'no node provided';
        }
        if (classStr !== undefined) {
            classStr = str2array(classStr);
            cls = ' ' + node.className + ' ';
            for (var i = 0, len = classStr.length; i < len; ++i) {
                cls = cls.replace(' ' + classStr[i] + ' ', ' ');
            }
            cls = trim(cls);
        } else {
            cls = '';
        }
        if (node.className != cls) {
            node.className = cls;
        }
    };

    var getSlideEl = function (slideNo) {
        if (slideNo > 0) {
            return slides[slideNo - 1];
        } else {
            return null;
        }
    };

    var getSlideTitle = function (slideNo) {
        var el = getSlideEl(slideNo);
        if (el) {
            var headers = el.getElementsByTagName('header');
            if (headers.length > 0) {
                return el.getElementsByTagName('header')[0].innerText;
            }
        }
        return null;
    };

    var getSlidePresenterNote = function (slideNo) {
        var el = getSlideEl(slideNo);
        if (el) {
            var n = el.getElementsByClassName('presenter_notes');
            if (n.length > 0) {
                return n[0];
            }
        }
        return null;
    };

    var changeSlideElClass = function (slideNo, className) {
        var el = getSlideEl(slideNo);
        if (el) {
            removeClass(el, 'prev prev_1 current next next_1 next_2 none');
            addClass(el, className);
        }
    };

    var updateSlideClasses = function (updateOther) {
        window.location.hash = (isPresenterView ? "presenter:" : "slide:") + currentSlideNo;

        for (i = 1; i < currentSlideNo - 1; i++) changeSlideElClass(i, 'none');
        changeSlideElClass(currentSlideNo - 2, 'prev_1');
        changeSlideElClass(currentSlideNo - 1, 'prev');
        changeSlideElClass(currentSlideNo, 'current');
        changeSlideElClass(currentSlideNo + 1, 'next');
        changeSlideElClass(currentSlideNo + 2, 'next_1');
        changeSlideElClass(currentSlideNo + 3, 'next_2');
        for (i = currentSlideNo + 4; i < slides.length + 1; i++) changeSlideElClass(i, 'none');

        highlightCurrentTocLink();

        document.getElementsByTagName('title')[0].innerText = getSlideTitle(currentSlideNo);

        updatePresenterNotes();

        if (updateOther) updateOtherPage();
        if (overviewActive) scrollToCurrent();
    };

    var updatePresenterNotes = function () {
        if (!isPresenterView) {
            return;
        }

        var existingNote = document.getElementById('current_presenter_notes');
        var currentNote = getSlidePresenterNote(currentSlideNo).cloneNode(true);
        currentNote.setAttribute('id', 'presenter_note');

        existingNote.replaceChild(currentNote, document.getElementById('presenter_note'));
    };

    var highlightCurrentTocLink = function () {
        var toc = document.getElementById('toc');

        if (toc) {
            var tocRows = toc.getElementsByTagName('tr');
            for (var i = 0; i < tocRows.length; i++) {
                removeClass(tocRows.item(i), 'active');
            }

            var currentTocRow = document.getElementById('toc-row-' + currentSlideNo);
            if (currentTocRow) {
                addClass(currentTocRow, 'active');
            }
        }
    };

    var updateOtherPage = function () {
        if (!showingPresenterView) {
            return;
        }

        var w = isPresenterView ? window.opener : presenterViewWin;
        if (w) w.postMessage('slide#' + currentSlideNo, '*');
    };

    var nextSlide = function () {
        if (currentSlideNo < slides.length) {
            currentSlideNo++;
        }
        updateSlideClasses(true);
    };

    var prevSlide = function () {
        if (currentSlideNo > 1) {
            currentSlideNo--;
        }
        updateSlideClasses(true);
    };

    var firstSlide = function () {
        currentSlideNo = 1;
        updateSlideClasses(true);
    };

    var lastSlide = function () {
        currentSlideNo = slides.length;
        updateSlideClasses(true);
    };

    var showNotes = function () {
        var slide = getSlideEl(currentSlideNo),
            notes = slide.getElementsByClassName('presenter_notes');
        for (var i = 0, len = notes.length; i < len; i++) {
            notes.item(i).style.display = (notesOn) ? 'none' : 'block';
        }
        notesOn = !notesOn;
        if (notesOn) {
            addClass(slide, 'presenter_notes');
        } else {
            removeClass(slide, 'presenter_notes');
        }
    };

    var showSlideNumbers = function () {
        var asides = document.getElementsByClassName('page_number');
        var hidden = asides[0].style.display != 'block';
        for (var i = 0; i < asides.length; i++) {
            asides.item(i).style.display = hidden ? 'block' : 'none';
        }
    };

    var showSlideSources = function () {
        var asides = document.getElementsByClassName('source');
        var hidden = asides[0].style.display != 'block';
        for (var i = 0; i < asides.length; i++) {
            asides.item(i).style.display = hidden ? 'block' : 'none';
        }
    };

    var showToc = function () {
        if (helpOpened) {
            showHelp();
        }
        var toc = document.getElementById('toc');
        if (toc) {
            toc.style.marginLeft = tocOpened ? '-' + (toc.clientWidth + 20) + 'px' : '0px';
            tocOpened = !tocOpened;
        }
        updateOverview();
    };

    var showHelp = function () {
        if (tocOpened) {
            showToc();
        }

        var help = document.getElementById('help');

        if (help) {
            help.style.marginLeft = helpOpened ? '-' + (help.clientWidth + 20) + 'px' : '0px';
            helpOpened = !helpOpened;
        }
    };

    var showPresenterView = function () {
        if (isPresenterView) {
            return;
        }

        if (showingPresenterView) {
            if (presenterViewWin)
                presenterViewWin.close();
            presenterViewWin = null;
            showingPresenterView = false;
        } else {
            presenterViewWin = open(window.location.pathname + "#presenter:" + currentSlideNo, 'presenter_notes',
                'directories=no,location=no,toolbar=no,menubar=no,copyhistory=no');
            showingPresenterView = true;
        }
    };

    var toggleOverview = function () {
        if (helpOpened) {
            showHelp();
            return
        }
        if (tocOpened) {
            showToc();
            return;
        }
        if (!overviewActive) {
            addClass(document.body, 'expose');
            overviewActive = true;
            scrollToCurrent();
        } else {
            removeClass(document.body, 'expose');
            overviewActive = false;
        }
        setScale();
        updateOverview();
    };
    var scrollToCurrent = function () {
        setTimeout(function () {
            document.querySelector('.slide.current').parentElement.scrollIntoView(true);
        });
    }

    var updateOverview = function () {
        try {
            var presentation = document.getElementsByClassName('presentation')[0];
        } catch (e) {
            return;
        }

        if (isPresenterView) {
            var action = overviewActive ? removeClass : addClass;
            action(document.body, 'presenter_view');
        }

        var toc = document.getElementById('toc');

        if (!toc) {
            return;
        }

        if (!tocOpened || !overviewActive) {
            presentation.style.marginLeft = '0px';
            presentation.style.width = '100%';
        } else {
            presentation.style.marginLeft = toc.clientWidth + 'px';
            presentation.style.width = (presentation.clientWidth - toc.clientWidth) + 'px';
        }
    };

    var computeScale = function () {
        var cSlide = document.getElementsByClassName('current')[0];
        var sx = (cSlide.clientWidth + 20) * (hiddenNext ? 2 : 1) / window.innerWidth;
        var sy = (cSlide.clientHeight + 20) / window.innerHeight;
        return 1 / Math.max(sy, sx);
    };

    var setScale = function () {
        var presentation = document.getElementsByClassName('slides')[0];
        var transform = 'scale(' + (overviewActive ? 1 : computeScale()) + ')';
        presentation.style.MozTransform = transform;
        presentation.style.WebkitTransform = transform;
        presentation.style.OTransform = transform;
        presentation.style.msTransform = transform;
        presentation.style.transform = transform;
    };

    var showNext = function () {
        var presentation = document.getElementsByClassName('slides')[0];
        addClass(presentation, 'show_next');
        hiddenNext = true;
        setScale();
    };

    var hideNext = function () {
        if (isPresenterView) {
            return;
        }
        var presentation = document.getElementsByClassName('slides')[0];
        removeClass(presentation, 'show_next');
        hiddenNext = false;
        setScale();
    };

    var toggleNext = function () {
        if (hiddenNext) {
            hideNext();
        } else {
            showNext();
        }
    };

    var toggleBlank = function () {
        blank_elem = document.getElementById('blank');

        blank_elem.style.display = blanked ? 'none' : 'block';

        blanked = !blanked;
    };

    var isModifierKey = function (keyCode) {
        switch (keyCode) {
            case 16: // shift
            case 17: // ctrl
            case 18: // alt
            case 91: // command
                return true;
                break;
            default:
                return false;
                break;
        }
    };

    var checkModifierKeyUp = function (event) {
        if (isModifierKey(event.keyCode)) {
            modifierKeyDown = false;
        }
    };

    var checkModifierKeyDown = function (event) {
        if (isModifierKey(event.keyCode)) {
            modifierKeyDown = true;
        }
    };

    var handleBodyKeyDown = function (event) {
        if (modifierKeyDown) {
            return
        }
        switch (event.keyCode) {
            case 13: // Enter
                if (overviewActive) {
                    toggleOverview();
                }
                break;
            case 27: // ESC
                toggleOverview();
                break;
            case 37: // left arrow
            case 38: // arrow up
            case 33: // page up
                event.preventDefault();
                prevSlide();
                break;
            case 39: // right arrow
            case 40: // arrow down
            case 32: // space
            case 34: // page down
                event.preventDefault();
                nextSlide();
                break;
            case 35: // end
                lastSlide();
                break;
            case 36: // home
                firstSlide();
                break;
            case 50: // 2
                showNotes();
                break;
            case 190: // .
            case 48: // 0
            case 66: // b
                if (!overviewActive) {
                    toggleBlank();
                }
                break;
            case 67: // c
                if (!overviewActive) {
                    toggleNext();
                }
                break;
            case 72: // h
                showHelp();
                break;
            case 78: // n
                if (!overviewActive) {
                    showSlideNumbers();
                }
                break;
            case 80: // p
                if (!overviewActive) {
                    showPresenterView();
                }
                break;
            case 83: // s
                if (!overviewActive) {
                    showSlideSources();
                }
                break;
            case 84: // t
                showToc();
                break;
        }
    };

        var handleWheel = function (event) {
        if (tocOpened || helpOpened || overviewActive) {
            return;
        }

        var delta = 0;

        if (!event) {
            event = window.event;
        }

        if (event.wheelDelta) {
            delta = event.wheelDelta / 120;
            if (window.opera) delta = -delta;
        } else if (event.detail) {
            delta = -event.detail / 3;
        }

        if (delta && delta < 0) {
            nextSlide();
        } else if (delta) {
            prevSlide();
        }
    };

    var addSlideClickListeners = function () {
        for (var i = 0; i < slides.length; i++) {
            var slide = slides.item(i);
            slide.num = i + 1;
            slide.addEventListener('click', function (e) {
                if (overviewActive) {
                    currentSlideNo = this.num;
                    toggleOverview();
                    updateSlideClasses(true);
                    e.preventDefault();
                }
                return false;
            }, true);
        }
    };

    var addRemoteWindowControls = function () {
        window.addEventListener("message", function (e) {
            if (e.data.indexOf("slide#") != -1) {
                currentSlideNo = Number(e.data.replace('slide#', ''));
                updateSlideClasses(false);
            }
        }, false);
    };

    var addTouchListeners = function () {
        document.addEventListener('touchstart', function (e) {
            touchStartX = e.touches[0].pageX;
        }, false);
        document.addEventListener('touchend', function (e) {
            var pixelsMoved = touchStartX - e.changedTouches[0].pageX;
            var SWIPE_SIZE = 150;
            if (pixelsMoved > SWIPE_SIZE) {
                nextSlide();
            }
            else if (pixelsMoved < -SWIPE_SIZE) {
                prevSlide();
            }
        }, false);
    };

    var addTocLinksListeners = function () {
        var toc = document.getElementById('toc');
        if (toc) {
            var tocLinks = toc.getElementsByTagName('a');
            for (var i = 0; i < tocLinks.length; i++) {
                tocLinks.item(i).addEventListener('click', function (e) {
                    currentSlideNo = Number(this.attributes['href'].value.replace('#slide:', ''));
                    updateSlideClasses(true);
                    e.preventDefault();
                }, true);
            }
        }
    };
    // initialize

    (function () {
        if (window.location.hash == "") {
            currentSlideNo = 1;
        } else if (window.location.hash.indexOf("#presenter:") != -1) {
            currentSlideNo = Number(window.location.hash.replace('#presenter:', ''));
            isPresenterView = true;
            showingPresenterView = true;
            presenterViewWin = window;
            addClass(document.body, 'presenter_view');
        } else {
            currentSlideNo = Number(window.location.hash.replace('#slide:', '')) || 1;
        }

        document.addEventListener('keyup', checkModifierKeyUp);
        document.addEventListener('keydown', handleBodyKeyDown);
        document.addEventListener('keydown', checkModifierKeyDown);
        document.addEventListener('visibilitychange', function (event) {
            if (document.hidden) {
                modifierKeyDown = false;
            }
        }, false);
        setInterval(function () {
            if (!document.hasFocus()) {
                modifierKeyDown = false;
            }
        }, 100);

        window.addEventListener("mousewheel", handleWheel);
        window.addEventListener("DOMMouseScroll", handleWheel);
        window.addEventListener("DOMContentLoaded", function () {
            setScale();
            hideNext();
        });
        window.onresize = function () {
            setScale();
        }

        for (var i = 0, el; el = slides[i]; i++) {
            addClass(el, 'slide');
        }
        updateSlideClasses(false);

        // add support for finger events (filter it by property detection?)
        addTouchListeners();
        addTocLinksListeners();
        addSlideClickListeners();
        addRemoteWindowControls();
    })();
}
