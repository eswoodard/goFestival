
const EVENTBRITE_SEARCH_URL = "https://www.eventbriteapi.com/v3/events/search/";
let map;
let focusableElementsString = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";
let focusedElementBeforeModal;

function getDataFromEventbrite(zipcode, radius){
	const settings = {
		"async": true,
		"crossDomain": true,
		"url": `https://www.eventbriteapi.com/v3/events/search/?q=festival&location.address=${zipcode}&location.within=${radius}&expand=organizer,%20venue&sort_by=date`,
		"method": "GET",
		"headers": {
			"Authorization": "Bearer 2543EBUADTSZK2TAFZS3",
		}
	}

	$.ajax(settings).done(handleEventbriteResponse);
}

function handleEventbriteResponse(response){
	STORE.events = response.events;
	const eventListHTML = response.events.map((item, index) => {
			return generateEventListHTML(item);	
	});																																						
	
	noResultsMessage();	
	$('.js-event-list-container').prop('hidden', false).html(eventListHTML);	

}

function getVenueAddress(venue) {
	const settings = {
		"async": true,
		"crossDomain": true,
		"url": ` https://www.eventbriteapi.com/v3/venues/${venue}/?token=2543EBUADTSZK2TAFZS3`,
		"method": "GET",		
	}

	$.ajax(settings).done(handleVenueAddress);
}

function handleVenueAddress(data){
	let venueLatLng = {lat: parseFloat(data.address.latitude), lng: parseFloat(data.address.longitude)};
	let eventVenueId = data.id;	
	createMarker(venueLatLng, eventVenueId);	
}

const STORE = {
	events: [],
}

function noResultsMessage(){
	if (STORE.events.length === 0){
		$('main').html(`
				<div class = "error-message">
					<p>No results found.  Please enter another zipcode.</p>
					<div class = "error-button">	
						<button class = "err-button button" type = "submit" >Try Again!</button>
					</div>
				</div>
			`)
		$("#search-box").addClass("hidden");
		$(".content-container").addClass("error");
		$(".error-button").on("click", event => {
			event.preventDefault();
	 		pageReload();
	 	});
	}
}

function pageReload(){
	location.reload();
}

function getEventById(eventId){
	for(let i = 0; i < STORE.events.length; i++){
		if(eventId === STORE.events[i].id){
			return STORE.events[i];
		}
	}
}

function getEventByVenueId(eventByVenueId){
	for(let i = 0; i < STORE.events.length; i++){
		if(eventByVenueId === STORE.events[i].venue_id){
			return STORE.events[i];
		}
	}
}

function generateEventListHTML(result) {
	const venueID = result.venue_id;
	const eventName = result.name.text;
	const eventDateAndTime = result.start.local;
	const eventDate = moment(eventDateAndTime).format("MMM Do");
	const eventMonth = eventDate.slice(0,4);
	const eventDay = eventDate.slice(4,-2);
	getVenueAddress(venueID);
	
	return `
	<div id = "items" onclick = "activateModalBox('${result.id}', '${result.venue_id}')">
			<button class = "event-list">	
				<ul class = "month-day">
					<li class = "month">${eventMonth}</li>
	 				<li class = "day">${eventDay}</li>
				</ul>
				<p class="title">${result.name.text}</p>	
	 		</button>
	 	</div>
	 	 `;
	}

function generateModalBoxContent(result){
	if(result.description.text === null){
		result.description.text = "No description available."
	}

	if(result.logo === null){
		result.logo = "Images/alt_logo.jpg"
	}

	const eventName = result.name.text;
	const eventURL = result.url;
	const eventLogo = result.logo.url;
	console.log(eventLogo);
	const eventDescription = result.description.text;
	const eventDateAndTime = result.start.local;
	const eventDateWithTime = moment(eventDateAndTime).format("MMM Do YYYY, h:mm a");
	const eventDate = eventDateWithTime.slice(0,13);
	const eventTime = eventDateWithTime.slice(15, 23);
	
		$('.event-information').html(`
		<div class = "eventName">
			<h2 class = "event-title" id="dialog-title"><a href = "${eventURL}" target = "_blank">${eventName}</a>
			</h2>
		</div>
		<div class = "event-logo"><img id="event-logo" src = "${eventLogo}" alt = "event logo"></div>
		<div class = "event-date-time">
			<ul class= "date-time">
				<li class = "date">Date: ${eventDate}</li>
				<li class = "time">Time: ${eventTime}</li>
			</ul>
		</div>
		<div class = "event-description"><p class = "description-and-more" id="dialog-description"><span class = "description-text">${eventDescription}</span><a class = "more" href = "${eventURL}" target = "_blank">...more</a></p></div>
		<div class = "event-link"><a href = "${eventURL}" target = "_blank">Click here for additional event information and ticketing</a></div>
		`);	

		limitDescriptionText(eventDescription);	
}

function limitDescriptionText(text){
	$('.description-text').text(function(index,currentText){
		return currentText.substr(0,650);
	});
}

function activateModalBox(eventId, obj){
	const event = getEventById(eventId);
	generateModalBoxContent(event);
	$(".modal, .modal-content").addClass("active");
	// $("body").on('focusin', '.content-container', function() {
		setFocusToFirstItemInModal($(".modal"));
	// });
	$(".modal, .modal-content").keydown(function(event) {
		trapTabKey($(this), event);
	});
	focusedElementBeforeModal = $(':focus');
}

function activateModalBoxWithMarker(eventByVenueID, obj){
	generateModalBoxContent(eventByVenueID);
	$(".modal, .modal-content").addClass("active");
	setFocusToFirstItemInModal($(".modal"));
	$(".modal, .modal-content").keydown(function(event) {
		trapTabKey($(this), event);
	});
	focusedElementBeforeModal = $(':focus');
}


function trapEscapeKey(obj, event) {
	console.log("trapEscapeKey ran");
	if (event.which == 27) {
		let o = obj.find('*');
		let cancelElement;
		cancelElement = o.filter(".close")
		cancelElement.click();
		event.preventDefault();
	}
}

//lines 191-226 are for screenreader/keyboard accessibility for modal box

function trapTabKey(obj, event){
	if (event.which == 9) {
		let o = obj.find('*');
		let focusableItems;
		focusableItems = o.filter(focusableElementsString).filter(':visible');
		let focusedItem;
		focusedItem = $(':focus');
		let numberOfFocusableItems;
		numberOfFocusableItems = focusableItems.length;
		let focusedItemIndex;
		focusedItemIndex = focusableItems.index(focusedItem);
		if(event.shiftKey){
			if(focusedItemIndex == 0) {
				focusableItems.get(numberOfFocusableItems -1).focus();
				event.preventDefault();
			}
		}
		else {
			if(focusedItemIndex == numberOfFocusableItems -1) {
				focusableItems.get(0).focus();
				event.preventDefault();
			}
		}
	}
}

function setInitialFocusModal(obj){
	let o = obj.find('*');
	let focusableItems;
	focusableItems = o.filter(focusableElementsString).filter(':visible').first().focus();
}

function setFocusToFirstItemInModal(obj){
	let o = obj.find('*');
	o.filter(focusableElementsString).filter(':visible').first().focus();
}

function bindEventListeners(){
	$(".close").on("click", function(){
		$(".modal, .modal-content").removeClass("active");
	});
	$(".modal, .modal-content").keydown(function(event) {
		trapEscapeKey($(this), event);
		focusedElementBeforeModal.focus();
	});
	
	watchSubmit();		
}
      
function initMap(query, miles) {
    map = new google.maps.Map(document.getElementById('map'), {
    	center: {lat: -34.397, lng: 150.644},
         zoom: 11,
    });

    let geocoder = new google.maps.Geocoder();
    centerMapOnZipcode(geocoder, map, query); 
}

function createMarker(latLng, eventByVenueId){
	let marker = new google.maps.Marker({
    	position: latLng,
    });
    marker.setMap(map);
   	const eventVenue = getEventByVenueId(eventByVenueId)
   	let infowindow = new google.maps.InfoWindow({
   		content: eventVenue.name.text,
   		maxWidth: 150,
   });
   
    marker.addListener('mouseover', function(){
    	infowindow.open(map, marker);
	});
	marker.addListener('mouseout', function(){
		infowindow.close();
	});
	marker.addListener('click', function(){
		activateModalBoxWithMarker(eventVenue);	
	});
}

function centerMapOnZipcode(geocoder, resultsMap, zipcode) {
	let address = zipcode;
	geocoder.geocode({'address':address}, function(results, status) {
		if (status === 'OK') {
			resultsMap.setCenter(results[0].geometry.location);
		}
		else {
			console.log("error");	
			$('.content-container').html(`
				<div class = "error-message">
					<p>No results found.  Please enter another zipcode.</p>
				</div>
			`)
		}
	});
}

function hideHeader() {
	$("h1").addClass("hidden");
	$("header").addClass("main-content");
	$(".search-input").addClass("main-content");
	$(".button").addClass("main-content");
}

function watchSubmit() {
	$('#js-search-form').submit(event => {
		event.preventDefault();
		hideHeader();
		const queryTarget = $(event.currentTarget).find('#js-query');
		const query = queryTarget.val();
		const queryRadius = $(event.currentTarget).find('#js-search-radius');
		const miles = queryRadius.val();
		getDataFromEventbrite(query, miles);
		initMap(query, miles); 
	});
}

$(bindEventListeners);
      
