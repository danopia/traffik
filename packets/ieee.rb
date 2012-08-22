class IEEE
  def self.run packet
    type = packet.bytes.first
    case type
      when 0x08; #puts 'IEEE data'
        #p packet[32..-1]
      when 0x40; #puts 'IEEE probe request'
      when 0x50; #puts 'IEEE probe response'
      when 0x80; #puts 'IEEE beacon'
        params = packet[24..-1]
        fixed = params[12..-1]
        puts fixed[2,fixed[1,1].bytes.first]
      when 0x88; #puts 'IEEE QoS data'
        #p packet[34..-1]
      when 0x94; #puts 'IEEE block ack'
      when 0xA4; #puts 'IEEE power-save poll'
      when 0xB4; #puts 'IEEE request to send'
      when 0xC4; #puts 'IEEE clear to send'
      when 0xC8; #puts 'IEEE QoS null function'
      when 0xD0; #puts 'IEEE action'
      when 0xD4; #puts 'IEEE acknowledgement'
      else; puts type
    end
  end
end

