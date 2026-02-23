package com.sloth.portfolio.service;

import com.sloth.portfolio.domain.DeliveryChannel;

public interface OtpMessageSender {

    void send(String phoneNumber, String code, DeliveryChannel channel);
}
