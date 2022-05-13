import "core-js/stable";
import "regenerator-runtime/runtime";

import * as model from "./model.js";
import {
  EXPAND_CARD_DURATION,
  FIRST_PAGE,
  MAX_PAGE,
  UNEXPAND_CARD_DURATION,
} from "./config.js";
import sideBarBtnsView from "./views/sideBarBtnsView.js";
import discoverMoviesView from "./views/discoverView.js";
import popularMoviesView from "./views/popularMoviesView.js";
import trendingView from "./views/trendingView.js";
import popularTVsView from "./views/popularTVsView.js";
import searchResultsView from "./views/searchResultsView.js";
import paginationView from "./views/paginationView.js";
import expansionView from "./views/expansionView.js";
import bookmarksView from "./views/bookmarksView.js";
import settingsView from "./views/settingsView.js";
import { controlMovieCards, createMovieObj } from "./helpers.js";
import genreCardsView from "./views/genreCardsView.js";
import cardZoomingView from "./views/movieSectionView.js";
import othersView from "./views/othersView.js";
import movieSectionView from "./views/movieSectionView.js";

// prettier-ignore
const controlDiscoverMovies = async function () {
  try {
    controlMovieCards(discoverMoviesView, "discoverMovies", "home");
    sideBarBtnsView.updateBtn();
  } catch (error) {
    console.log(error);
  }
};

const controlNavBtns = async function (event) {
  try {
    const sidebar = document.querySelector(".movie-sidebar-nav");

    if (sidebar.classList.contains("active")) {
      othersView.shrinkSections("remove");
      othersView.expandSidebar("remove");
      othersView.showOverlay("remove");
      othersView.hideToolTip("hidden");
      setTimeout(() => othersView.hideToolTip("visible"), 2000);
    }
    sideBarBtnsView.renderActive(event);

    // Prevents data from being rendered again each time the user clicks the same button.
    if (sideBarBtnsView.buttonPage === model.data.pages.currentPageType) return;

    // Prevents data from rendering when user clicks nav expand button.
    if (sideBarBtnsView.buttonPage === "expand") return;

    if (sideBarBtnsView.buttonPage === "home") {
      controlMovieCards(discoverMoviesView, "discoverMovies", "home");
    }
    if (sideBarBtnsView.buttonPage === "movies-pop") {
      controlMovieCards(popularMoviesView, "popularMovies", "movies-pop");
    }
    if (sideBarBtnsView.buttonPage === "trending") {
      controlMovieCards(trendingView, "trendingMovies", "trending");
    }
    if (sideBarBtnsView.buttonPage === "tvs-pop") {
      controlMovieCards(popularTVsView, "popularTVS", "tvs-pop");
    }
    if (sideBarBtnsView.buttonPage === "bookmarks") {
      model.data.pages.currentPageType = "bookmark";

      genreCardsView.renderGenreErrorMsg();

      if (model.data.bookMarksData.length === 0)
        throw new Error("You dont have any bookmarks yet.");

      bookmarksView.renderLoading();

      bookmarksView.renderHTML(
        model.data.bookMarksData,
        model.data.bookMarksData
      );
    }
  } catch (error) {
    bookmarksView.renderErrorMsg(error.message);
  }
};

const controlSearchResults = async function () {
  try {
    genreCardsView.renderGenreErrorMsg();

    // Remove's active icons in sidebar
    sideBarBtnsView.updateBtn("search-res");
    sideBarBtnsView.buttonPage = "search";

    const searchVal = searchResultsView.getInputValue();
    searchResultsView.renderLoading();
    await model.createSearchResults(searchVal);
    searchResultsView.renderHTML(
      model.data.searchResults,
      model.data.bookMarksData
    );
  } catch (error) {
    searchResultsView.renderErrorMsg(error.message);
  }
};

// prettier-ignore
const controlPagination = async function (event) {
  try {
    // Starts the function when one of the buttons has been clicked
    paginationView.buttonClicked(event);

    if (paginationView.btnType === "") return;

    // Function stops when user clicks back and the page is in the first page.
    if (paginationView.btnType === "back" && model.data.pages.currentPage === FIRST_PAGE) return;

    // Function stops when user clicks next and the page is in the last page.
    if (paginationView.btnType === "next" && model.data.pages.currentPage === MAX_PAGE) return;

    paginationView.renderLoading();

    await model.createPageResults(paginationView.btnType, paginationView.pageNum);

    paginationView.renderHTML(model.data.pages.pageResults, model.data.bookMarksData);
    paginationView.renderPagination(model.data.pages.currentPageLast);
  } catch (error) {
    console.log(error);
    paginationView.renderErrorMsg(error.message);
  }
};

const controlMovieSection = async function (e) {
  let expandDuration;

  const btn = e.target.closest(".expand-btn");

  if (!btn) return;

  const expandSection = document.querySelector(".expansion-section");
  const movieCard = e.target.closest(".movie-card");
  const btnId = btn.dataset.cardId;

  window.location.hash = btnId;
  console.log(model.data.settings.cardZooming);

  if (model.data.settings.cardZooming) {
    expandDuration = EXPAND_CARD_DURATION;
    cardZoomingView.renderCardZoom(movieCard);
  }

  movieSectionView.shrinkSections();

  setTimeout(() => {
    controlExpansionSection();
    expandSection.classList.add("active");
  }, expandDuration);
};

const controlExpandBackButton = function (e) {
  const expandSection = document.querySelector(".expansion-section");
  const trailerVideo = document?.querySelector(".trailer-video");
  const cardClone = document?.querySelector(".movie-card-clone");

  let expandDuration;

  window.location.hash = "";

  expandSection.classList.remove("active");

  if (model.data.settings.cardZooming && cardClone) {
    cardZoomingView.renderCardShrink();
    expandDuration = UNEXPAND_CARD_DURATION;
  }

  setTimeout(() => {
    movieSectionView.unShrinkSections();
    trailerVideo?.remove();
  }, expandDuration / 2);
};

// prettier-ignore
const controlBookmarkBtn = async function (isActive) {
  try {
    const id = +window.location.hash.slice(1);
    const movieCard = document.querySelector(`#movie-${id}`)
    const bmIcon = movieCard.querySelector('.bm-icon')
    
    if (!id) return;

    // Inserts the bookmarked id in the data.
    if (isActive) {
      const dataHolder = [];
      dataHolder.push(model.data.expansion.videoDetails)
      const bookMarkData = createMovieObj(dataHolder)
      model.data.bookMarksData.push(...bookMarkData);
      bmIcon.classList.add('active')
    }
    else {
      const newBookmarkData = model.data.bookMarksData.filter((val) => val.id !== id);
      model.data.bookMarksData = newBookmarkData;
      bmIcon.classList.remove('active')
    }
    console.log(model.data.bookMarksData);
  } catch (error) {
    console.log(error);
  }
};

// prettier-ignore
const controlExpansionSection = async function () {
  try {
    const videoId = +window.location.hash.slice(1);

    expansionView.renderLoading();

    await model.createExpandPage(videoId);

    // Check if the movie/tv show has been bookmarked already
    const isBookMarked = model.data.bookMarksData.some(data => data.id === videoId);

    if (!model.data.expansion.videoData) return;

    await expansionView.renderHTML(
      model.data.expansion.videoData,
      model.data.expansion.videoDetails,
      model.data.expansion.videoCasts,
      isBookMarked
    );

    expansionView.addEventHandler(controlBookmarkBtn);
    console.log(model.data.expansion.videoDetails);
  } catch (error) {
    console.log(error);
  }
};

const renderGenreCards = async function () {
  try {
    paginationView.renderLoading();
    await model.createGenreCards();
    genreCardsView.renderHTML(
      model.data.genre.genresResult,
      model.data.bookMarksData
    );
    paginationView.renderPagination(model.data.pages.currentPageLast);
  } catch (error) {
    console.error(error);
    genreCardsView.renderErrorMsg(error.message);
  }
};

/**
 * Controls the genre filtering buttons.
 * @param {event} event - event fired when genre filter button has been clicked.
 */
// prettier-ignore
const controlGenreCards = async function (event) {
  try {
    const btn = event.target.closest(".filters-btn");
    const genreArr = model.data.genre.genreArr;

    if (!btn) return;

    paginationView.pageNum = 1;

    if (!btn.classList.contains("active")) {
      genreArr.push(btn.dataset.genreId);
      btn.classList.add("active");
    }
    else {
      genreArr.pop(btn.dataset.genreId);
      btn.classList.remove("active");
    }

    renderGenreCards();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// prettier-ignore
const controlSettings = function (e) {
  const btn = e.target.closest(".toggler-list");

  if (!btn) return;

  const settingType = btn.dataset.setting;

  btn.classList.toggle("active");

  if (settingType === "dark-mode") {
    model.data.settings.darkMode = !model.data.settings.darkMode;
    document.body.classList.toggle("darkmode");
  }

  if (settingType === "card-zooming") {
    model.data.settings.cardZooming = !model.data.settings.cardZooming;
  }  
  
  if (settingType === "disable-transition") {
    model.data.settings.disableTransitions = !model.data.settings.disableTransitions;
    document.body.classList.toggle("disable-transitions");
  }
  if (settingType === "disable-zooms") {
    othersView.shrinkSectionsCopy('toggle')
    model.data.settings.enableZoom = !model.data.settings.enableZoom;
    othersView.zoomEnabled = model.data.settings.enableZoom;
  }
};

/**
 * Shows the expanded page when a movie/tv show id has been detected in the URL.
 */
const showExpandSection = function () {
  // Show's expand section immediately when there's an id in the url
  if (window.location.hash) {
    movieSectionView.shrinkSections();
    document.querySelector(".expansion-section").classList.add("active");
    controlExpansionSection();
  }
};

// prettier-ignore
const loadDatas = function () {
  const bookMarksData = JSON.parse(localStorage.getItem("bookmarksData"));
  const settingsData = JSON.parse(localStorage.getItem("settingsData")) ?? model.data.settings;

  model.data.bookMarksData = [...new Set(bookMarksData)];
  console.log(settingsData);
  model.data.settings = settingsData;

  settingsView.updateSettings(model.data.settings);
};

const init = function () {
  // Show expand section when page is loaded and there's an id in the url.
  showExpandSection();
  // Load data's when page has been loaded.
  loadDatas();
  // Loads Discover Movie Card's when page is loaded.
  controlDiscoverMovies();

  // Attach Event Handlers
  movieSectionView.addBackEventHandler(controlExpandBackButton);
  movieSectionView.addEventHandler(controlMovieSection);

  genreCardsView.addEventHandler(controlGenreCards);
  paginationView.addHandlerEvent(controlPagination);

  searchResultsView.addHandlerEvent(controlSearchResults);
  sideBarBtnsView.addHandlerEvent(controlNavBtns);
  settingsView.addEventHandler(controlSettings);
};

init();

// prettier-ignore
window.onbeforeunload = () => {
  localStorage.setItem("bookmarksData",JSON.stringify(model.data.bookMarksData))
  localStorage.setItem('settingsData', JSON.stringify(model.data.settings))
}
