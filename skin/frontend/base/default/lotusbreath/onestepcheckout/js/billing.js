(function ($, window) {
    'use strict';
    /* Billing */
    $.widget('lotusbreath.onestepcheckout', $.lotusbreath.onestepcheckout, {
        options: {
            billing: {
                addressDropdownSelector: '#billing-address-select',
                newAddressFormSelector: '#billing-new-address-form',
                continueSelector: '#billing-buttons-container .button',
                form: '#co-billing-form',
                countryDropdownSelector: '#billing\\:country_id',
                city: '#billing\\:city',
                region: '#billing\\:region',
                region_id: '#billing\\:region_id',
                useForShippingAddressCheckboxId: '#billing\\:use_for_shipping_yes',
                noUseForShippingAddressCheckboxId: '#billing\\:use_for_shipping_no',
                reloadImmediately : false
            }
        },

        _submitBillingTimeOut: false,



        _submitBillingChange: function () {
            var _this = this;
            //
            var timeoutBillingFunction = function () {
                //console.log(_this.options.billing.reloadImmediately);
                var reloadImmediately = _this.options.billing.reloadImmediately;
                if (!reloadImmediately && $(_this.options.billing.newAddressFormSelector + " input:focus ," + _this.options.billing.newAddressFormSelector + " select:focus").length) {
                    _this._submitBillingTimeOut = setTimeout(timeoutBillingFunction, 500);
                    return;
                }
                if ($(_this.options.billing.useForShippingAddressCheckboxId).is(':checked')
                    || _this.options.billing.alwaysUseShippingAsBilling
                ) {

                    _this._updateLocation(null, 'billing_shipping');
                } else {
                    _this._updateLocation(null, 'billing');
                }
                if(_this._submitBillingTimeOut)
                    clearTimeout(_this._submitBillingTimeOut);
            };

            if(_this.options.billing.reloadImmediately){
                timeoutBillingFunction();
            }else{
                this._submitBillingTimeOut = setTimeout(timeoutBillingFunction, 100);
            }
            //this._submitBillingTimeOut = setTimeout(timeoutBillingFunction, 100);
        },


        _onchangeBillingLocactionFields: function () {
            var _this = this;
            $(_this.options.billing.newAddressFormSelector + " input ," + _this.options.billing.newAddressFormSelector + " select")
                .on('change', function () {
                    if (!$(this).hasClass('change_location_field') && $(this).hasClass('required-entry')) {
                        var needUpdated = true;
                        var reloadImmediately = _this.options.billing.reloadImmediately;

                        if(!reloadImmediately){
                            $(_this.options.billing.newAddressFormSelector + " input ," + _this.options.billing.newAddressFormSelector + " select").each(
                                function (i, ele) {
                                    //console.log( $(ele).name + ' : ' + $(ele).val());
                                    if (!$(ele).val() && $(ele).hasClass('required-entry') && $(ele).is(':visible'))
                                        needUpdated = false;
                                }
                            );
                        }

                        if (needUpdated) {
                            _this._submitBillingChange();
                            needUpdated = false;
                        }
                    }
                }
            );
            $(_this.options.billing.newAddressFormSelector + " .change_location_field").on('change', function () {

                _this._submitBillingChange();
            });

            if ($(_this.options.billing.countryDropdownSelector).hasClass('update-location-region-class')) {
                $("#billing\\:region_id").on('change', function () {
                    if (!$(this).is(':visible'))
                        return false;
                    _this._submitBillingChange();
                    /*
                    if ($(_this.options.billing.useForShippingAddressCheckboxId).is(':checked')
                        || _this.options.billing.alwaysUseShippingAsBilling
                    ) {
                        _this._updateLocation(null, 'billing_shipping');
                    } else {
                        _this._updateLocation(null, 'billing');
                    }
                    */
                });
                $("#billing\\:region:visible").on('change', function () {

                    if (!$(this).is(':visible'))
                        return false;
                    _this._submitBillingChange();
                    /*
                    if ($(_this.options.billing.useForShippingAddressCheckboxId).is(':checked')
                        || _this.options.billing.alwaysUseShippingAsBilling
                    ) {
                        _this._updateLocation(null, 'billing_shipping');
                    } else {
                        _this._updateLocation(null, 'billing');
                    }
                    */
                });
            }
        },
        _validateBillingForm: function () {

            return true;
        },
        _create: function () {
            this._super();
            var _this = this;

            var isCheckExistEmail = $("input[name='billing[create_new_account]']").is(":checked") || $("#billing\\:email").hasClass('check-email-exists');
            if (isCheckExistEmail) {
                $("#billing\\:email").trigger('change');
            }
            $("input[name='billing[create_new_account]']").on('change', function () {
                if ($(this).is(":checked")) {
                    $("#billing\\:email").trigger('change');
                }
            });
            $("#billing\\:email").bind('change', function () {
                var isCheckExistEmail = $("input[name='billing[create_new_account]']").is(":checked") || $("#billing\\:email").hasClass('check-email-exists');
                if (!isCheckExistEmail)
                    return;

                this.queueProcess('check_email', {
                    url: _this.options.billing.checkExistsUrl,
                    type: 'POST',
                    //async : false,
                    data: {email: $("#billing\\:email").val()},
                    complete: function (response) {
                        try {
                            var responseObject = $.parseJSON(response.responseText);
                        } catch (ex) {
                            _this._removeWait();
                            return true;
                        }
                        if (responseObject && responseObject.success == false) {
                            _this._removeWait();
                            _this._openConfirmExistEmail();
                        }

                    }

                });
            });

            _this._onchangeBillingLocactionFields();
            this.element
                .on('click', _this.options.billing.noUseForShippingAddressCheckboxId, function () {

                    $(_this.options.shipping.countryDropdownSelector) && $(_this.options.shipping.countryDropdownSelector).trigger('change');
                })
                .on('change', this.options.billing.addressDropdownSelector, $.proxy(function (e) {
                    this.element.find(this.options.billing.newAddressFormSelector).toggle(!$(e.target).val());
                    if ($(_this.options.billing.useForShippingAddressCheckboxId).is(':checked')
                        || _this.options.billing.alwaysUseShippingAsBilling
                    ) {
                        _this._updateLocation(null, 'billing_shipping');
                    } else {
                        _this._updateLocation(null, 'billing');
                    }
                }, this))
                .find(this.options.billing.form).validation();

            if (_this.options.autoDetectLocation) {
                try {
                    this.autoDetectLocation();
                } catch (e) {

                }
            }
            var that = this;

            /**
             * checkbox : is create new account
             */
            if ($("input[name=\"billing[create_new_account]\"]").checked)
                $(that.options.checkout.registerCustomerPasswordSelector).show();
            else
                $(that.options.checkout.registerCustomerPasswordSelector).hide();
            $("input[name=\"billing[create_new_account]\"]").click(function () {
                if (this.checked)
                    $(that.options.checkout.registerCustomerPasswordSelector).show();
                else
                    $(that.options.checkout.registerCustomerPasswordSelector).hide();
            });

            /**
             * checkbox address
             */
                //shipping-area
            $("#billing_use_same_shipping").change(
                function () {
                    if ($("#billing\\:use_for_shipping_yes").length) {
                        if ($("#billing\\:use_for_shipping_yes").is(":checked") == 1) {
                            $("#shipping-area").hide();
                        } else {
                            $("#shipping-area").show();
                        }
                    } else {
                        $("#shipping-area").hide();
                    }

                }
            );
            $("input[name=\"billing[use_for_shipping]\"]").trigger('change');

            return this;
        }


    });
})(jQuery);