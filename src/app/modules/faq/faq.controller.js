class FAQCtrl {
    constructor() {
        'ngInject';

        this.FaqList=true;
        this.viewKey=1;
        $(function() {
            $(["/images/faq.png","/images/plus.png","/images/minus.png"]).preload();
        });
    }
    /**
     * showhideList() Load the wallet in app and store in local storage
     *
     * @param data: base64 data from .wlt file
     * @param: isNCC: true if NCC wallet, false otherwise
     */
    showhideList(data,key){
      this.FaqList=data;
      this.viewKey=key;
    }

}

export default FAQCtrl;
