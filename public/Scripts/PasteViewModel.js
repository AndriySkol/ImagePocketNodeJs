function PasteViewModel() {
    function editclick(data, event) {
        var parent = $(event.target).parent().parent();



        
        tinymce.init({
            selector: "#myModalEditBody",
            
            plugins: [
                "advlist autolink lists link image charmap print preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table contextmenu paste"
            ],
            
            
            paste_webkit_styles: "all",
            paste_data_images: true,
            paste_retain_style_properties: "all",
            
            toolbar: "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image"
        });
        tinymce.activeEditor.setContent(data.innerText(), { format: 'raw' });
        $("#editName").val(data.name());
        $("#myModalEdit").modal("show");
        $("myModalEditBody").removeClass("modal-body");
        $("#myModalEdit #modalSubmit").click(
            function () {
       
                var el = $(event.target).parent();


                var x = tinymce.activeEditor.getContent({ format: 'raw' });

                data.innerText(x);
                data.name($("#editName").val());
                tinymce.activeEditor.remove();

                $("#myModalEdit").modal("hide");
              
                var dataInput = {
                    'data': data.innerText(),
                    'name': data.name()

                };

                $.ajax(
               {
                   type: "PUT",
                   url:  "/api/pastes/" + data.id,
                   data: dataInput,



               });



            });
        

    }

    var self = this;
   
    self.tagEditModal = {
        activeTags: ko.observableArray(),
        inputText : ko.observable(),
        
    }
    self.submitTagChange = function () {
        var arr = self.tagEditModal.activeTags()();
        var resultAdd = [], resultRemove = [];
        for (var i = 0; i < arr.length; ++i) {
            if(arr[i].isValid())
            {
                resultAdd.push({'id': arr[i].id, 'name': arr[i].name});
            }
            else {
                if (arr[i].id) {
                    resultRemove.push(arr[i].id);
                }
            }

        }

        $.ajax(
            {
                type: "POST",
                url: "/api/updateTagPaste/" + self.tagEditModal.chosenPaste.id,
                contentType: 'application/json',
                data: JSON.stringify(resultAdd),
              


            })
            .then(function () {
                $.ajax(
                    {
                        type: "POST",
                        url: "/api/deleteTagConnections",
                        contentType: 'application/json',
                        data: JSON.stringify(resultRemove)



                    });
             });
          
       
        
      

      
      
        $("#myModal").modal("hide");
        

    }
    self.toogleValid = function(data)
    {
        data.isValid(!data.isValid());
    }
    self.addNewActive = function()
    {
        var arr = self.tagEditModal.activeTags();
        if (self.tagEditModal.inputText().trim() == "")
        {
            return;
        }
        for (var i = 0; i < self.allTags().length; ++i) {

            if (self.tagEditModal.inputText() == self.allTags()[i].name) {
                self.tagEditModal.activeTags.push({ id: self.allTags()[i].id, name: self.tagEditModal.inputText(), isValid: ko.observable(true) });
                return;
            }
        }
        for (var i = 0; i < arr().length; ++i)
        {
            if (self.tagEditModal.inputText() == arr()[i].name)
            {
                return;
            }
        }
        self.tagEditModal.activeTags.push({ name: self.tagEditModal.inputText(), isValid: ko.observable(true) });
    }
    self.enableEditModal = function(data)
    {
        self.tagEditModal.inputText("");
        self.tagEditModal.chosenPaste = data;
        $.get( "/api/tagsToPaste", { 'id': data.id, 'data': new Date() })
        .done(function(data)
        {
            self.tagEditModal.activeTags(ko.observableArray(ko.utils.arrayMap(data, function (activeTag)
            {
                activeTag.isValid = ko.observable(true);
                return activeTag;
            })));
            $("#modalAuto").typeahead({ source: self.allTagsNames(), minLength: 0 });
            $("#myModal").modal("show");
        });
    }
    
    
    $.get("/api/init", { date: new Date() })
    .done(function (data) {
        self.pastes = ko.observableArray(ko.utils.arrayMap(data.pastes, function (paste) {
            return { id: paste.id, name: ko.observable(paste.name), fileName: paste.fileName, dateString: new Date(paste.date), loaded: false, innerText: ko.observable("Loading...") };
        }));
        self.selectedTags = ko.observableArray();
        self.allTags = ko.observableArray(data.tags);
        for (var i = 0; i < self.allTags().length; ++i) {
            self.allTags()[i].name = self.allTags()[i].name.trim();
        }
        self.filteredPastes = ko.observableArray();
        var filteredComputed = ko.computed(function () {
            var ids = [];
            for (i = 0; i < self.allTags().length; ++i) {
                if ($.inArray(self.allTags()[i].name, self.selectedTags()) != -1) {
                    ids.push(self.allTags()[i].id);
                }

            }
            var t = self.pastes();

            $.get("/api/filters", { 'filters': ids, data: new Date() })
                    .done(function (res) {



                        self.filteredPastes(ko.utils.arrayFilter(self.pastes(), function (item) {
                            for (var i = 0; i < res.length; ++i) {
                                if (res[i].id == item.id) {

                                    return true;
                                }
                            }
                            return false;
                        }))

                    });

        }, this);



      


        self.allTagsNames = ko.computed(function () {
            
            return $.map(self.allTags(), function (val, index) {
                return val.name.toString().trim();
            });
        }, this
        );
   

    
        self.openRecord = function (data) {
            if (!data.Loaded) {




                $.get("/api/pastes/" + data.id, { date: new Date() })
                    .success(function (res) {

                    data.innerText(res);
                    $(".innerDivs").contents().css("position", "relative");

                    });

            }
        };

        self.removeRecord = function (data) {
            bootbox.confirm("Do you realy want to delete the record", function (result) {

                if (result)

                    $.ajax(
                        {
                            type: "DELETE",
                            url: "/api/pastes/" + data.id,

                            success: function () {
                                self.pastes.remove(data);

                            }
                        });

            });


        };

        self.changePaste = function (data, event) {

            if (!data.Loaded) {

                $.get("/api/pastes/" + data.id, { date: new Date() })
                    .success(function (res) {

                        data.innerText(res);
                        editclick(data, event);

                    });

            }
            else {
                editclick(data, event);
            }
        };
        self.mouseEnter = function (data, event) {
            $("#menu2").find("span").hide();
            $("#menu2").find(".date").hide();
            $(event.target).find("span").show();
            $(event.target).find(".date").show();
            $(event.target).addClass("activated");
           
        };
        self.mouseLeave = function (data, event) {

         
        }

        self.checker = ko.computed(function () {
            return self.allTags().length != 0;
        }, this
        );
        ko.applyBindings(self);
       

        var t = $("#pasteFilters")
        .multiselect(
        {

            onDropdownHide: function () {

                var x = $("#filtersForm");
                x.submit();
            }
        });

    });
 

}