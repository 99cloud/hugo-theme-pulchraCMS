const initSearch = (indexes) => {
  let term = null;
  let blocks = indexes.map((index) => handleIndex(index)).flat();

  let fuse = newFuse(blocks);

  document.querySelector("#searchInput").addEventListener("input", (event) => {
    term = event.target.value
      .trim()
      // remove OR operator https://fusejs.io/examples.html#extended-search
      .replace("!", "");

    scrollSearchResultToTop();

    search();
  });

  /**
   * Get fuse instance.
   */
  function newFuse(blocks) {
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

    return new Fuse(blocks, options);
  }

  /**
   * Scroll search result (the ul element) to top.
   */
  function scrollSearchResultToTop() {
    let searchResult = document.querySelector("#searchResults");
    searchResult.scrollTop = 0;
  }

  /**
   * Handle index
   * 1. split main content by heading
   * 2. extract the content of different element
   */
  function handleIndex(index) {
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
   * Convert angle brackets to entity.
   * "<" to "&lt;"
   * ">" to "&gt;"
   */
  function angleBrackets2Entity(string) {
    return string.replace(/[<>]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  /**
   * Convert entity to angle brackets.
   * "&lt;" to "<"
   * "&gt;" to ">"
   */
  function entity2AngleBrackets(string) {
    return string.replace(/(&lt;|&gt;)/g, function (c) {
      return { "&lt;": "<", "&gt;": ">" }[c];
    });
  }

  /**
   * Search.
   */
  function search() {
    let results = fuse.search(term);

    results = filterByScore(results);

    results = highlight(results);

    let resultsLength = results.length;

    // showSearchToolbar(resultsLength)

    if (resultsLength) {
      showSearchResults(results);
      handleEventForOpenInternalLinks(indexes);
    } else {
      noSearchResults();
    }
  }

  /**
   * Filter array by score
   * See https://fusejs.io/api/options.html#includescore
   */
  function filterByScore(results) {
    return results.filter((item) => item.score <= 1);
  }

  /**
   * Build fuse js query
   * See https://fusejs.io/api/query.html#logical-query-operators
   */
  function query() {
    return {
      $or: [
        {
          $and: [{ title: term }, { "paragraphs.value": term }],
        },
        { title: term },
        { "paragraphs.value": term },
      ],
    };
  }

  function debounce(fn, delay) {
    let timer;

    return function () {
      let context = this;

      let args = arguments;

      clearTimeout(timer);

      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
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
          ? `<span class="${highlightClass}">${angleBrackets2Entity(
              item
            )}</span>`
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
   * Show the meta information.
   */
  function showSearchToolbar(resultsLength) {
    let toolbarHtml = `<div>搜索到${resultsLength}个结果</div>`;

    document.querySelector("#searchBoxToolBar").innerHTML = toolbarHtml;
  }

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
   * When click search icon toggle Search Box show or hidden.
   */
  document.querySelector("#searchIcon").addEventListener("click", (event) => {
    toggleSearchBox();
  });

  /**
   * Toggle Search Box show or hidden.
   */
  function toggleSearchBox() {
    if (isSearchBoxShow()) {
      hideSearchBox();
    } else {
      showSearchBox();
    }
  }

  function isSearchBoxShow() {
    return document.querySelector("#searchBox").style.display == "block";
  }

  /**
   * Show Search Box.
   */
  function showSearchBox() {
    document.querySelector("#searchBox").style.display = "block";
    document.querySelector("#searchInput").value = "";
    document.querySelector("#searchInput").focus();
    document.querySelector("html").setAttribute("style", "overflow-y: hidden;");
  }

  /**
   * Hidden Search Box.
   */
  function hideSearchBox() {
    document.querySelector("#searchBox").style.display = "none";
    document.activeElement.blur();
    document
      .querySelector("html")
      .removeAttribute("style", "overflow-y: auto;");
  }

  /**
   * When click area(except search icon) that outside the search box, hidden it.
   */
  document.addEventListener("click", (event) => {
    var input = document.querySelector("#searchInput");
    var icon = document.querySelector("#searchIcon");
    var target = event.target;

    if (input != target && icon != target) {
      hideSearchBox();
    }
  });

  /**
   * Handle press enter.
   */
  function handlePressEnter() {
    if (document.querySelector("#searchInput") == document.activeElement) {
      openFirstSearchResult();
    }

    delayHideSearchBox();
  }

  /**
   * Delay hidden search box.
   */
  function delayHideSearchBox() {
    if (isSearchBoxShow()) {
      setTimeout(() => {
        hideSearchBox();
      }, 10);
    }
  }

  /**
   * Open first search result.
   */
  function openFirstSearchResult() {
    let firstLink = document
      .querySelector("#searchResults")
      .querySelector("li")
      .querySelector("a");
    if (firstLink) {
      firstLink.click();
    }
  }

  /**
   * Allow control search box by keyboard.
   */
  document.addEventListener("keydown", function (event) {
    // "/" key
    if (event.keyCode === 191) {
      // Stop print window open.
      event.preventDefault();

      // Toggle Search Box show or hidden.
      toggleSearchBox();
    }

    // ESC key
    if (event.keyCode == 27) {
      // Hidden search box.
      hideSearchBox();
    }

    // Enter key
    if (event.keyCode == 13) {
      handlePressEnter();
    }

    // Down arrow and up arrow
    if (event.keyCode == 40 || event.keyCode == 38) {
      if (!isSearchBoxShow()) return;

      let input = document.querySelector("#searchInput");

      // <a> tags.
      let links = document
        .querySelector("#searchResults")
        .querySelectorAll("a");

      // No search result.
      if (links.length == 0) return;

      // First <a> element.
      let first = links[0];

      // Second <a> element.
      let second = links[1];

      // Last <a> element.
      let last = links[links.length - 1];

      // Stop window from scrolling.
      event.preventDefault();

      // Down arrow.
      if (event.keyCode == 40) {
        // If the currently focused element is the main input. Focus the second <a>.
        if (document.activeElement == input) {
          second.focus();
        }
        // If we're at the bottom, stay there.
        else if (document.activeElement == last) {
          last.focus();
        }
        // Otherwise select the next search result.
        else {
          // document -> focused <a> -> <li> -> next<li> -> <a>
          document.activeElement.parentElement.nextElementSibling.firstElementChild.focus();
        }
      }

      // Up arrow
      if (event.keyCode == 38) {
        // If we're in the input box, do nothing
        if (document.activeElement == input) {
          input.focus();
        }
        // If we're at the first item, go to input box
        else if (document.activeElement == first) {
          input.focus();
        }
        // Otherwise, select the search result above the current active one
        else {
          // document -> focused <a> -> <li> -> previous<li> -> <a>
          document.activeElement.parentElement.previousElementSibling.firstElementChild.focus();
        }
      }
    }
  });
};
