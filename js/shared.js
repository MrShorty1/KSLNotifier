var shared = {};

//	Counter to change the ID
shared.selectedCategory = "";
//	Starts the notifications by getting the category, once the category has been pulled from storage it runs getInfo
shared.startNotifications = function(){
	chrome.storage.local.get('selectedCategory', shared.getCategoryHandler);
};

//	The handler for the chrome.local.get callback.
shared.getCategoryHandler = function(storage){
	shared.selectedCategory = storage.selectedCategory;
	//	Gets the info from the site once the seleted category has been found
	shared.getInfo();
};

//	Runs an ajax request depending on the selected category.
shared.getInfo = function(){
	//	Gets the category selected in the options pane and sets it to the url
	if(shared.selectedCategory !== null)
	{
	var splitCategory = shared.selectedCategory.split(",");
	var categoryUrl = LookupCategories[splitCategory[0]][splitCategory[1]];
	//	Ajax query to ksl to get information
	$.ajax({url: 'http://www.ksl.com/resources/classifieds/rss_.xml'+categoryUrl, success: function(data){
		var $xml = $(data);
		var $guid = $xml.find('item guid');
			//	Checks if the most recent item is the same as the last notified item
			if(localStorage.guid != $guid.eq(0).text())
			{
				localStorage.guid = $guid.eq(0).text();
				var $title = $xml.find('item title');
				var $time = $xml.find('item pubDate');
				var $desc = $xml.find('item description');
				var $links = $xml.find('item link');
				shared.notify($title.eq(0).text(), $desc.eq(0).text(), $time.eq(0).text(), $links.eq(0).text());
			}
		}
		});
	}
};

//	Function to display the notification if something is new
//	Currently not implementing the time
shared.notify = function(title, description, time, link) {
	var opt = {
		type: "basic",
		title: title,
		message: description,
		iconUrl: "../kslicon.png"
	};
	var idKey = 'id' + localStorage.count;
	//	linkIdentifier is set here to create links on notifications
	var linkIdentifier = { identifier: [idKey, link] };
		if(localStorage.storageArray)
		{
			var arrayStore = JSON.parse(localStorage.storageArray);
			arrayStore.push(linkIdentifier);
			localStorage.storageArray = JSON.stringify(arrayStore);
		}
		else
		{
			var newStore = [];
			newStore.push(linkIdentifier);
			localStorage.storageArray = JSON.stringify(newStore);
		}
	//	Shows the notification
	chrome.notifications.create(idKey, opt, shared.logCallback);
	localStorage.count++;
};

//	The handler for onclick method of the notifications. Set in background.js
shared.notificationId = function(id){
	var linkArray = JSON.parse(localStorage.storageArray);
	for(var i = 0; i < linkArray.length; i++)
	{
		if(linkArray[i].identifier[0] === id)
		{
			chrome.tabs.create({url: linkArray[i].identifier[1], active: true});
		}
	}
};

//	Need this function, gets called when a notification is shown.
shared.logCallback = function(id){
	// Currently do nothing
};