(function () {
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  var headerInner = document.querySelector(".header__inner");

  if (!burger || !nav || !headerInner) return;

  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    headerInner.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("is-open");
      headerInner.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Открыть меню");
    });
  });
})();
