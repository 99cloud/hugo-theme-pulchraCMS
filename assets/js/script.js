$(document).ready(function () {
  // 计算轮播图片宽度
  function computeCarouseBoxWidth() {
    const imgCount = $("#content .about_section .box").children().length;
    const boxWidth = 187 * imgCount + 6 * (imgCount - 1);

    $("#content .about_section-partner").width(boxWidth);
  }

  computeCarouseBoxWidth();

  // active menu
  var hash = window.location.pathname;

  function removeFooterForPostsDetail(path) {
    var postsDetailReg = /^\/posts\/\S+/;
    var newsDetailReg = /^\/news\/\S+/;
    if (postsDetailReg.test(path) || newsDetailReg.test(path)) {
      $(".footer__container").remove();
      $(".footer__background").remove();
    }
  }

  removeFooterForPostsDetail(hash || "");

  function getRealHash(hash) {
    var hashMap = {
      "/download/software/": "/download/",
      "/developer/whitepaper/": "/developer/",
      "/posts/blog/": "/posts/",
      "/posts/news/": "/posts/",
    };
    const key = Object.keys(hashMap).find(function (it) {
      return hash.indexOf(it) >= 0;
    });
    if (key) {
      return hashMap[key];
    }
    return hash;
  }

  var realHash = getRealHash(hash);

  $(".navbar-nav>li").each((index, ele) => {
    if (realHash === ele.getAttribute("data-url")) {
      $(ele).find("a").addClass("active");
    }
  });

  $(".navbar-nav>li").on("click", function () {
    $(this).siblings().find("a").removeClass("active");
    $(this).find("a").addClass("active");
  });

  // mobile nav
  // $(".navbar-nav>li>a").on("click", function () {
  //   $(".navbar-collapse").collapse("hide");
  // });

  /* functionSection hover change */
  function initActive() {
    const firstEle = $(".function .function-slider-item").first();

    firstEle.addClass("active");
    const imgUrl = $(firstEle).find("img").attr("src");
    $(firstEle)
      .find("img")
      .attr("src", imgUrl?.replace("-icon.svg", "-icon-h.svg"));

    $(".function-slider-item").mouseenter(function () {
      $(this).addClass("active");
      $(this).siblings().removeClass("active");

      var defaultImageUrl = $(this).find("img").attr("src");

      $(".function-slider-item").each((index, ele) => {
        const iconSrc = ele.getAttribute("data-url");

        $(ele).find("img").attr("src", iconSrc);
      });

      if (!(defaultImageUrl.indexOf("-icon-h.svg") > -1)) {
        $(this)
          .find("img")
          .attr("src", defaultImageUrl?.replace("-icon", "-icon-h"));
      } else {
        $(this)
          .find("img")
          .attr("src", defaultImageUrl?.replace("-icon-h", "-icon-h"));
      }
      // right change
      const imgSrc = $(this).attr("data-image");
      const description = $(this).attr("data-description");
      $(".function .function-img").find("img").attr("src", imgSrc);
      document.getElementById("function-description").innerHTML = description;
    });
  }

  initActive();

  // wishes slider
  $(".wishes-content").slick({
    infinite: true,
    slidesToShow: 2,
    slidesToScroll: 1,
    dots: false,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
    // fade: true,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          dots: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
        },
      },
    ],
  });

  // 返回顶部
  $(".backToTop").hide();
  var height = $(window).height();
  $(window).scroll(function () {
    const media = window.matchMedia("(max-width: 991px)");
    if (media.matches) {
      return;
    }
    if ($(window).scrollTop() > height) {
      $(".backToTop").fadeIn(1000);
    } else {
      $(".backToTop").fadeOut(1000);
    }
  });
});

// 关于页瀑布流
if (document.querySelector("#macy-container")) {
  var masonry = new Macy({
    container: "#macy-container",
    trueOrder: false,
    waitForImages: false,
    useOwnImageLoader: false,
    debug: true,
    mobileFirst: true,
    columns: 1,
    margin: {
      y: 16,
      x: "2%",
    },
    breakAt: {
      991: 3,
    },
  });
}
