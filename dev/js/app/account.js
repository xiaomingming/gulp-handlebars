require(['jquery', 'hbs_account'], function($, entry) {
    $(function() {
        var data = {
            title: '账户页',
            lists: [{ desc: '1' }, { desc: '2' }]
        };
        var accountHtml = Vip.account.main(data);
        $('#app').html(accountHtml);

    });
});
