function setStatusMessage(txt,alertType){
	
	switch (alertType){
		case 'primary':
			alert_txt = 'alert-primary';
			break;
		case 'secondary':
			alert_txt = 'alert-secondary';
			break;
		case 'success':
			alert_txt = 'alert-success';
			break;
		case 'danger':
			alert_txt = 'alert-danger';
			break;
		case 'warning':
			alert_txt = 'alert-warning';
			break;
		case 'info':
			alert_txt = 'alert-info';
			break;
		case 'light':
			alert_txt = 'alert-light';
			break;
		case 'dark':
			alert_txt = 'alert-dark';
			break;
		default:
			throw('Incorrect alert Type');
			alert_txt = 'danger';
				
	}
    $("#status_message")
        .empty()
        .append('<div class="alert ' + alert_txt + ' alert-dismissible col-sm-12" role="alert"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + txt + '</div>');
}





function handleError(err){

    setStatusMessage('ERROR','danger');
	console.error(err);

}
