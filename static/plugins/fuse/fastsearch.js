var fuse; // holds our search engine
var fuseIndex;
var searchVisible = true;
var firstRun = true; // allow us to delay loading json data unless search activated
var list = document.getElementById("searchResults"); // targets the <ul>
var first = list.firstChild; // first child of search list
var last = list.lastChild; // last child of search list
var maininput = document.getElementById("searchInput"); // input box for search
var resultsAvailable = false; // Did we get any search results?
var term = null;

// ==========================================
// The main keyboard event listener running the show
//
document.addEventListener("keydown", function (event) {
  // CMD-/ to show / hide Search
  if (event.altKey && event.which === 191) {
    // Load json search index if first time invoking search
    // Means we don't load json unless searches are going to happen; keep user payload small unless needed
    doSearch(event);
  }

  // Allow ESC (27) to close search box
  if (event.keyCode == 27) {
    if (searchVisible) {
      document.getElementById("fastSearch").style.visibility = "hidden";
      document.activeElement.blur();
      // searchVisible = false;
    }
  }

  // DOWN (40) arrow
  if (event.keyCode == 40) {
    if (searchVisible && resultsAvailable) {
      event.preventDefault(); // stop window from scrolling
      if (document.activeElement == maininput) {
        first.focus();
      } // if the currently focused element is the main input --> focus the first <li>
      else if (document.activeElement == last) {
        last.focus();
      } // if we're at the bottom, stay there
      else {
        document.activeElement.parentElement.nextSibling.firstElementChild.focus();
      } // otherwise select the next search result
    }
  }

  // UP (38) arrow
  if (event.keyCode == 38) {
    if (searchVisible && resultsAvailable) {
      event.preventDefault(); // stop window from scrolling
      if (document.activeElement == maininput) {
        maininput.focus();
      } // If we're in the input box, do nothing
      else if (document.activeElement == first) {
        maininput.focus();
      } // If we're at the first item, go to input box
      else {
        document.activeElement.parentElement.previousSibling.firstElementChild.focus();
      } // Otherwise, select the search result above the current active one
    }
  }
});

// ==========================================
// execute search as each character is typed
//
document.getElementById("searchInput").onkeyup = function (e) {
  scrollSearchResultToTop();
  term = this.value;
  executeSearch(this.value);
};

/**
 * Scroll search result (the ul element) to top.
 */
function scrollSearchResultToTop() {
  let searchResult = document.querySelector("#searchResults");
  searchResult.scrollTop = 0;
}

document.querySelector("body").onclick = function (e) {
  if (e.target.tagName === "BODY" || e.target.tagName === "DIV") {
    document.getElementById("searchResults").style.visibility = "hidden";
    document.getElementById("searchResults").style.transition = "none";

    //   hideSearch();
  }
};

document.querySelector("#fastSearch").onclick = function (e) {
  document.getElementById("searchResults").style.visibility = "visible";
  doSearch(e);
};

function doSearch(e) {
  e.stopPropagation();
  if (firstRun) {
    loadSearch(); // loads our json data and builds fuse.js search index
    firstRun = false; // let's never do this again
  }
  // Toggle visibility of search box
  if (!searchVisible) {
    showSearch(); // search visible
  } else {
    // hideSearch();
  }
}

function hideSearch() {
  document.getElementById("fastSearch").style.visibility = "hidden"; // hide search box
  document.activeElement.blur(); // remove focus from search box
  searchVisible = false;
}

function showSearch() {
  // document.getElementById("fastSearch").style.visibility = "visible"; // show search box
  document.getElementById("searchInput").focus(); // put focus in input box so you can just start typing
  searchVisible = true;
}

// ==========================================
// fetch some json without jquery
//
function fetchJSONFile(path, callback) {
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function () {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        var data = JSON.parse(httpRequest.responseText);
        if (callback) callback(data);
      }
    }
  };
  httpRequest.open("GET", path);
  httpRequest.send();
}

// ==========================================
// load our search index, only executed once
// on first call of search box (CMD-/)
//
function loadSearch() {
  fetchJSONFile("/index.json", function (data) {
    let blocks = data.map((index) => handleIndex(index)).flat();

    var options = {
      shouldSort: true,
      minMatchCharLength: 1,
      includeMatches: true,
      ignoreLocation: true,
      // distance: 100,
      // location: 0,
      includeScore: true,
      useExtendedSearch: true,
      threshold: 0.1,
      keys: [
        {
          name: "title",
          weight: 12,
        },
        {
          name: "paragraphs.value",
          weight: 1,
        },
      ],
    };
    // Create the Fuse index
    // fuseIndex = Fuse.createIndex(options.keys, data);
    fuse = new Fuse(blocks, options); // build the index from the json file
  });
}

// ==========================================
// using the index we loaded on CMD-/, run
// a search query (for "term") every time a letter is typed
// in the search box
//
function executeSearch(term) {
  let results = fuse.search(term);

  results = filterByScore(results);

  results = highlight(results);
  let resultsLength = results.length;

  // showSearchToolbar(resultsLength)

  if (resultsLength) {
    showSearchResults(results);
    // handleEventForOpenInternalLinks(indexes);
  } else {
    noSearchResults();
  }
}
// function executeSearch(term) {
//   let results = fuse.search(term); // the actual query being run using fuse.js
//   let searchitems = ""; // our results bucket

//   if (results.length === 0) {
//     // no results based on what was typed into the input box
//     resultsAvailable = false;
//     searchitems = "";
//   } else {
//     // build our html
//     console.log(results);
//     permalinks = [];
//     numLimit = 5;
//     for (let item in results) {
//       // only show first 5 results
//       if (item > numLimit) {
//         break;
//       }
//       if (permalinks.includes(results[item].item.permalink)) {
//         continue;
//       }
//       //   console.log('item: %d, title: %s', item, results[item].item.title)
//       searchitems =
//         searchitems +
//         '<li><a href="' +
//         results[item].item.permalink +
//         '" tabindex="0">' +
//         '<span class="title">' +
//         results[item].item.title +
//         "</span></a></li>";
//       permalinks.push(results[item].item.permalink);
//     }
//     resultsAvailable = true;
//   }
//   console.log("searchitems", searchitems);
//   document.getElementById("searchResults").innerHTML = searchitems;
//   if (results.length > 0) {
//     first = list.firstChild.firstElementChild; // first result container — used for checking against keyboard up/down location
//     last = list.lastChild.firstElementChild; // last result container — used for checking against keyboard up/down location
//   } else {
//     noSearchResults();
//   }
// }

/**
 * Show search results.
 */
function showSearchResults(results) {
  let innerHTML = results
    .map((result) => {
      return `<li><a href=${result.permalink}  tabindex="0"><div class="search-result-title">${result.path}${result.title}</div><ul class="search-result-paragraphs">${result.paragraphs}</ul></a></li>`;
    })
    .join("");

  document.querySelector("#searchResults").innerHTML = innerHTML;
}

/**
 * No search Results.
 */
function noSearchResults() {
  document.querySelector(
    "#searchResults"
  ).innerHTML = `<li><div class="no-search-results">无结果</div></li>`;
}

/**
 * Handle index
 * 1. split main content by heading
 * 2. extract the content of different element
 */
function handleIndex(index) {
  console.log("index", index);
  let paths = index.fullPath
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  let blocks = [
    {
      title: paths[paths.length - 1],
      path: paths.slice(1, -1).length
        ? paths.slice(1, -1).join(" <span class='separator'>/</span> ") +
          " <span class='separator'>/</span> "
        : "",
      permalink: index.permalink,
      level: 1,
      paragraphs: [],
    },
  ];

  let contentContainer = new DOMParser()
    .parseFromString(index.mainContent, "text/html")
    .querySelector("article");

  if (!contentContainer) {
    return blocks;
  }

  for (const element of contentContainer.children) {
    // no need handle noindex
    if (element.hasAttribute("noindex")) {
      continue;
    }

    let block = {
      paragraphs: [],
    };

    // Handle headings
    if (["H2", "H3", "H4", "H5", "H6"].includes(element.nodeName)) {
      let level = parseInt(element.nodeName.substr(1, 2));
      let parentBlock = blocks
        .filter((block) => block.level < level)
        .slice(-1)[0];

      block.title = element.innerText;
      block.path = `${
        parentBlock.path + parentBlock.title
      }<span class='separator'> / </span>`;
      block.permalink = `${index.permalink}#${element
        .querySelector("span")
        .getAttribute("id")}`;
      block.level = level;

      blocks.push(block);
    }
    // Handle paragraphs
    else {
      let parentBlock = blocks
        .filter((block) => block.level != null)
        .slice(-1)[0];

      // handle code element and delete code from parent
      for (const codeNode of element.querySelectorAll("code")) {
        // skip inline code element
        if (!codeNode.childElementCount) {
          continue;
        }

        codeNode.parentNode.removeChild(codeNode);
        for (const codeLine of codeNode.children) {
          const lineNumberNode = codeLine.querySelector(".line-number");
          if (lineNumberNode) {
            codeLine.removeChild(lineNumberNode);
          }

          parentBlock.paragraphs.push({
            value: codeLine.innerText,
          });
        }
      }

      for (const line of element.innerText.split("\n").filter(Boolean)) {
        parentBlock.paragraphs.push({
          value: line,
        });
      }
    }
  }

  return blocks;
}

/**
 * Filter array by score
 * See https://fusejs.io/api/options.html#includescore
 */
function filterByScore(results) {
  return results.filter((item) => item.score <= 1);
}

/**
 * Highlight search results.
 */
function highlight(results) {
  return results
    .map((result) => {
      let matches = result.matches.map((match) => {
        let value = null;
        if (match.key == "title") {
          value = highlightTitle(match);
        }

        if (match.key == "paragraphs.value") {
          value = highlightParagraphs(match);
        }

        return {
          key: match.key,
          value: value,
        };
      });

      let title = matches
        .filter((match) => match.key == "title")
        .map((match) => match.value)
        .join("");

      let paragraphs = matches
        .filter((match) => match.key == "paragraphs.value")
        .map((match) => match.value)
        .join("");

      return {
        path: result.item.path,
        permalink: result.item.permalink,
        title: title || result.item.title,
        paragraphs: paragraphs,
        rawTitle: result.item.title,
        hasTitle: title != "",
        hasParagraphs: paragraphs != "",
      };
    })
    .filter((result) => result.hasTitle || result.hasParagraphs);
}

/**
 * Highlight title.
 */
function highlightTitle(match) {
  return wholeHighlight(match, "highlight-title");
}

/**
 * Highlight paragraphs.
 */
function highlightParagraphs(match) {
  const MAX_CHARS = 120;
  // No need split the value for short string.
  if (match.value.length <= MAX_CHARS) {
    var paragraph = wholeHighlight(match, "highlight-paragraph");
  }
  // Highlight and split for long string.
  else {
    var paragraph = splitHighlight(match, "highlight-paragraph");
  }

  return paragraph
    ? `<li class="search-result-paragraph">${paragraph}</li>`
    : "";
}

/**
 * Highlight without split.
 */
function wholeHighlight(match, highlightClass) {
  let value = match.value;

  return [...value]
    .map((item, index) => {
      let matched = match.indices.some((range) => {
        return (
          index >= range[0] &&
          index <= range[1] &&
          rangeLongerThenMinTermLength(range)
        );
      });
      return matched
        ? `<span class="${highlightClass}">${angleBrackets2Entity(item)}</span>`
        : angleBrackets2Entity(item);
    })
    .join("");
}

/**
 * Highlight and split by "...".
 */
function splitHighlight(match, highlightClass) {
  let value = match.value;

  return (
    match.indices
      // low correlation match https://github.com/krisk/Fuse/issues/409#issuecomment-623160126
      .filter((range) => rangeLongerThenMinTermLength(range))
      .slice(0, 5)
      .map((range) => {
        let offset = 46;

        let prefixStart = range[0] - offset <= 0 ? 0 : range[0] - offset;
        let prefix = value.slice(prefixStart, range[0]).replace(/.*\n/, "");

        let suffixEnd =
          range[1] + 1 + offset >= value.length
            ? value.length
            : range[1] + 1 + offset;
        let suffix = value.slice(range[1] + 1, suffixEnd).replace(/\n.*/, "");

        let highlight = value.slice(range[0], range[1] + 1);

        let punctuations = [" ", ".", "。", "!", "！", "？", "?", "\n"];

        // Append "..." to start if the prefix is truncated
        if (prefixStart != 0) {
          let startIndex = range[0] - prefix.length;
          let beforePrefixStart = value.slice(startIndex - 1, startIndex);
          if (!punctuations.includes(beforePrefixStart)) {
            prefix = `...${prefix}`;
          }
        }

        // Append "..." to end if the suffix is truncated
        if (suffixEnd != value.length) {
          let endIndex = range[1] + suffix.length;
          let afterSuffixEnd = value.slice(endIndex, endIndex + 1);
          if (!punctuations.includes(afterSuffixEnd)) {
            suffix = `${suffix}...`;
          }
        }

        return `${angleBrackets2Entity(
          prefix
        )}<span class="${highlightClass}">${angleBrackets2Entity(
          highlight
        )}</span>${angleBrackets2Entity(suffix)}`;
      })
      .join("")
  );
}

/**
 * Determine if the difference between range1 and range0
 * is equal to or greater than the minimum length of the term.
 */
function rangeLongerThenMinTermLength(range) {
  let lengths = term
    // remove token. see https://fusejs.io/examples.html#extended-search
    .replace(/(^=)/, "")
    .replace(/(^')/, "")
    .replace(/(^\!)/, "")
    .replace(/(^\^)/, "")
    .replace(/(^")/, "")
    .replace(/(\$$)/, "")
    .replace(/("$)/, "")
    .split(" ")
    .map((item) => item.length);

  return range[1] + 1 - range[0] >= Math.min(...lengths);
}

/**
 * Convert angle brackets to entity.
 * "<" to "&lt;"
 * ">" to "&gt;"
 */
function angleBrackets2Entity(string) {
  return string.replace(/[<>]/g, function (c) {
    return { "<": "&lt;", ">": "&gt;" }[c];
  });
}
