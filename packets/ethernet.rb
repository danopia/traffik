require './packets/ip'

class Ethernet
  def self.run packet
    dest = packet[0, 6]
    src = packet[6, 6]
    type = packet[12, 2].unpack('v').first
    
    if type == 8 # IP
      IP.run packet[14..-1]
    else
      puts "Packet type #{type} seen"
    end
  end
end

